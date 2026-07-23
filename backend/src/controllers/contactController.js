const pool = require("../db");
const { dispatchWebsiteAnalysis } = require("./businessController");

// backend/controllers/contactController.js

exports.insertContactsBulk = async (req, res) => {
  const { businessId, contacts } = req.body;

  if (!businessId || !Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      message: "Missing businessId or contacts array.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let insertedCount = 0;

    if (contacts.length > 0) {
      for (const contact of contacts) {
        await client.query(
          `
          INSERT INTO contacts (
            business_id, first_name, last_name, job_title, 
            email, phone, linkedin_url, source, confidence_score, enrichment_status, enrichment_source
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', 'serpapi_linkedin')
          `,
          [
            businessId,
            contact.firstName || contact.first_name || "Decision Maker",
            contact.lastName || contact.last_name || "",
            contact.jobTitle || contact.job_title || "Owner / Executive",
            contact.email || null,
            contact.phone || null,
            contact.linkedinUrl || contact.linkedin_url || null,
            contact.source || "serpapi_linkedin",
            contact.confidenceScore || 75,
          ]
        );
        insertedCount++;
      }
    }

    // Advance business status to 'enriched'
    await client.query(
      `UPDATE businesses SET workflow_status = 'enriched' WHERE id = $1`,
      [businessId]
    );

    // Get campaignId to update campaign status if this was the last active job
    const bRes = await client.query(`SELECT campaign_id FROM businesses WHERE id = $1`, [businessId]);
    const campaignId = bRes.rows[0]?.campaign_id;

    await client.query("COMMIT");

    // Trigger website analysis phase for this business
    dispatchWebsiteAnalysis(businessId);

    // Check if campaign is completely done across all jobs
    if (campaignId) {
      const remaining = await pool.query(
        `SELECT COUNT(*)::int FROM automation_jobs WHERE campaign_id = $1 AND status IN ('queued', 'running')`,
        [campaignId]
      );
      if (parseInt(remaining.rows[0].count, 10) === 0) {
        await pool.query(
          `UPDATE campaigns SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [campaignId]
        );
      }
    }

    res.json({
      success: true,
      inserted: insertedCount,
      businessId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Contact Insertion Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// backend/controllers/contactController.js

exports.handleEnrichmentFailure = async (req, res) => {
  const { businessId, error } = req.body;

  try {
    // 1. Mark business as 'failed' (or 'enriched' with 0 contacts so website analysis can still run)
    const result = await pool.query(
      `UPDATE businesses 
       SET workflow_status = 'failed' 
       WHERE id = $1 
       RETURNING campaign_id`,
      [businessId]
    );

    if (result.rows.length > 0) {
      const campaignId = result.rows[0].campaign_id;
      
      // 2. Check if all jobs in this campaign are done (completed or failed)
      const remainingJobs = await pool.query(
        `SELECT COUNT(*)::int FROM automation_jobs WHERE campaign_id = $1 AND status IN ('queued', 'running')`,
        [campaignId]
      );

      if (parseInt(remainingJobs.rows[0].count, 10) === 0) {
        await pool.query(
          `UPDATE campaigns SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [campaignId]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error handling enrichment failure:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};