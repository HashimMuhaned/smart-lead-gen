const pool = require("../db");
const { dispatchWebsiteAnalysis } = require("./businessController");

// Helper to check if campaign finished
async function checkCampaignCompletion(campaignId) {
  const remaining = await pool.query(
    `SELECT COUNT(*)::int FROM automation_jobs WHERE campaign_id = $1 AND status IN ('queued', 'running')`,
    [campaignId],
  );
  if (parseInt(remaining.rows[0].count, 10) === 0) {
    await pool.query(
      `UPDATE campaigns SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [campaignId],
    );
  }
}

exports.insertContactsBulk = async (req, res) => {
  const { jobId, businessId, contacts } = req.body;

  if (!businessId || !Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      message: "Missing businessId or contacts array.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert contacts if any were found
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
            contact.jobTitle || contact.job_title || "Executive",
            contact.email || null,
            contact.phone || null,
            contact.linkedinUrl || contact.linkedin_url || null,
            contact.source || "serpapi_linkedin",
            contact.confidenceScore || 75,
          ],
        );
      }
    }

    // 2. Mark business as 'enriched'
    await client.query(
      `UPDATE businesses SET workflow_status = 'enriched' WHERE id = $1`,
      [businessId],
    );

    // 3. Mark automation job as 'completed'
    if (jobId) {
      await client.query(
        `UPDATE automation_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [jobId],
      );
    }

    // 4. Retrieve campaignId for status check
    const bRes = await client.query(
      `SELECT campaign_id FROM businesses WHERE id = $1`,
      [businessId],
    );
    const campaignId = bRes.rows[0]?.campaign_id;

    await client.query("COMMIT");

    // 5. Trigger next step (website analysis)
    dispatchWebsiteAnalysis(businessId);

    // 6. Check if campaign is finished overall
    if (campaignId) {
      checkCampaignCompletion(campaignId);
    }

    res.json({ success: true, inserted: contacts.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Contact Insertion Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// Failure callback from Scraper
exports.handleEnrichmentFailure = async (req, res) => {
  const { jobId, businessId, error } = req.body;

  try {
    // 1. Update business status to failed (or 'enriched' if you still want website analysis to attempt running)
    const result = await pool.query(
      `UPDATE businesses SET workflow_status = 'failed' WHERE id = $1 RETURNING campaign_id`,
      [businessId],
    );

    // 2. Update automation_jobs table
    if (jobId) {
      await pool.query(
        `UPDATE automation_jobs 
         SET status = 'failed', completed_at = NOW(), error_message = $1 
         WHERE id = $2`,
        [error, jobId],
      );
    }

    // 3. Check if overall campaign finished
    if (result.rows.length > 0) {
      checkCampaignCompletion(result.rows[0].campaign_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error handling enrichment failure:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
