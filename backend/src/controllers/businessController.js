const pool = require("../db");
const axios = require("axios");

// Put your enrichment webhook URL here (save to .env later as N8N_ENRICHMENT_WEBHOOK_URL)
const N8N_ENRICHMENT_WEBHOOK =
  "https://n8nselfhostedautomations.tech/webhook-test/contact-enrichment";

exports.insertBusinesses = async (req, res) => {
  const { jobId, campaignId, businesses } = req.body;

  if (!businesses || !Array.isArray(businesses)) {
    return res.status(400).json({
      success: false,
      message: "Payload missing 'businesses' array.",
    });
  }

  const client = await pool.connect();
  const startTime = Date.now();

  let insertedCount = 0;
  let skippedCount = 0;
  const queuedJobsToDispatch = []; // Holds references for the webhook trigger loop

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      const result = await client.query(
        `
        INSERT INTO businesses
        (
          campaign_id, name, category, address, city, country, 
          phone, website, google_maps_url, google_rating, 
          review_count, social_links, source, workflow_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'enriching')
        ON CONFLICT (campaign_id, google_maps_url) DO NOTHING
        RETURNING id
        `,
        [
          campaignId,
          business.name,
          business.category,
          business.address,
          business.city,
          business.country,
          business.phone,
          business.website,
          business.google_maps_url,
          business.google_rating,
          business.review_count,
          business.social_links ? JSON.stringify(business.social_links) : null,
          business.source || "google_maps",
        ],
      );

      if (result.rows.length > 0) {
        insertedCount++;
        const businessId = result.rows[0].id;

        const jobResult = await client.query(
          `
          INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
          VALUES ($1, $2, 'contact_enrichment', 'queued', $3)
          RETURNING id
          `,
          [campaignId, businessId, JSON.stringify({ businessId })],
        );

        // Save to the array so we can safely loop after the DB transaction completes
        queuedJobsToDispatch.push({
          jobId: jobResult.rows[0].id,
          businessId: businessId,
        });
      } else {
        skippedCount++;
      }
    }

    await client.query(
      `
      UPDATE campaigns 
      SET 
        status = 'enriching',
        total_leads = (SELECT COUNT(*)::int FROM businesses WHERE campaign_id = $1),
        updated_at = NOW()
      WHERE id = $1
      `,
      [campaignId],
    );

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    const jobOutput = {
      inserted: insertedCount,
      skipped: skippedCount,
      executionTime,
      source: "google_maps",
    };

    await client.query(
      `
      UPDATE automation_jobs
      SET output = $2
      WHERE id = $1
      `,
      [jobId, JSON.stringify(jobOutput)],
    );

    await client.query("COMMIT");

    // --- UPDATED: BATCH PUSH TO n8n ---
    // We send the entire array of queued jobs at once so n8n can handle the loop orchestration natively.
    if (queuedJobsToDispatch.length > 0) {
      console.log(
        `[Push Dispatcher] Spawning batch payload of ${queuedJobsToDispatch.length} enrichment jobs to n8n...`,
      );
      axios
        .post(N8N_ENRICHMENT_WEBHOOK, {
          campaignId: campaignId,
          jobs: queuedJobsToDispatch,
        })
        .catch((e) =>
          console.error(
            `[Push Error] Failed dispatching batch payload to n8n:`,
            e.message,
          ),
        );
    }

    res.json({
      success: true,
      ...jobOutput,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Ingestion Layer Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

exports.getBusinessById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name, website, city, country, phone FROM businesses WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }
    res.json({ success: true, business: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.insertBulkContacts = async (req, res) => {
  const { id } = req.params; // business_id
  const { contacts } = req.body;

  if (!contacts || !Array.isArray(contacts)) {
    return res
      .status(400)
      .json({ success: false, message: "Missing 'contacts' array." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const contact of contacts) {
      await client.query(
        `
        INSERT INTO contacts (
          business_id, first_name, last_name, job_title, email, phone, linkedin_url, source, enrichment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
        `,
        [
          id,
          contact.first_name || null,
          contact.last_name || null,
          contact.job_title || null,
          contact.email || null,
          contact.phone || null,
          contact.linkedin_url || null,
          contact.source || "enrichment_pipeline",
        ],
      );
    }

    // Upgrade business lifecycle status
    await client.query(
      "UPDATE businesses SET workflow_status = 'enriched' WHERE id = $1",
      [id],
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      message: `Successfully inserted ${contacts.length} contacts.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};
