const pool = require("../db");
const axios = require("axios");

// Put your enrichment webhook URL here (save to .env later as N8N_ENRICHMENT_WEBHOOK_URL)
const N8N_ENRICHMENT_WEBHOOK =
  "https://n8nselfhostedautomations.tech/webhook/contact-enrichment";

const SCRAPER_SERVICE_URL =
  process.env.SCRAPER_SERVICE_URL ||
  "https://scrape-service.n8nselfhostedautomations.tech";


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
  const queuedJobsToDispatch = [];

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      // 1. Insert business with default workflow_status 'enriching'
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

      // 2. If row inserted (not skipped), create its corresponding enrichment job
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

        // Collect newly created jobs to dispatch to the scraper server
        queuedJobsToDispatch.push({
          jobId: jobResult.rows[0].id,
          businessId: businessId,
        });
      } else {
        skippedCount++;
      }
    }

    // 3. Update campaign status and count
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

    // 4. Record execution log output for the original scraping job
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

    // 5. Commit everything in a single clean transaction
    await client.query("COMMIT");

    // 6. Return standard response immediately to scraper
    res.json({
      success: true,
      ...jobOutput,
    });

    // 7. Fire-and-forget push dispatcher: Asynchronously notify Scraper Server for each queued job
    if (queuedJobsToDispatch.length > 0) {
      (async () => {
        for (const job of queuedJobsToDispatch) {
          try {
            await axios.post(`${SCRAPER_SERVICE_URL}/contact-enrichment`, {
              jobId: job.jobId,
              businessId: job.businessId,
            });
            console.log(
              `[Push Dispatcher] Triggered contact enrichment on Scraper Server for Job ${job.jobId}`,
            );
          } catch (err) {
            console.error(
              `[Push Dispatcher Error] Failed to trigger Job ${job.jobId}:`,
              err.message,
            );
          }
        }
      })();
    }
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
      `SELECT id, campaign_id, name, website, city, country, phone, workflow_status FROM businesses WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    res.json({ success: true, business: result.rows[0] });
  } catch (err) {
    console.error("Get Business Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

