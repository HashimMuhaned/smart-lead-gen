const pool = require("../db");
const { dispatchWebsiteAnalysis } = require("./businessController");
const { reconcileCampaignStatus } = require("../utils/campaignStatus");

exports.insertContactsBulk = async (req, res) => {
  const { jobId, businessId, contacts } = req.body;

  if (!businessId || !Array.isArray(contacts)) {
    return res.status(400).json({ success: false, message: "Missing businessId or contacts array." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (contacts.length > 0) {
      for (const contact of contacts) {
        await client.query(
          `INSERT INTO contacts
             (business_id, first_name, last_name, job_title, email, phone, linkedin_url, source, confidence_score, enrichment_status, enrichment_source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', 'serpapi_linkedin')`,
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

    await client.query(`UPDATE businesses SET workflow_status = 'enriched' WHERE id = $1`, [businessId]);

    if (jobId) {
      await client.query(
        `UPDATE automation_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [jobId],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Contact Insertion Error:", err);
    client.release();
    return res.status(500).json({ success: false, message: err.message });
  }

  client.release();

  // Outside the transaction, awaited fully before responding.
  // dispatchWebsiteAnalysis creates the next automation_job AND reconciles
  // campaign status itself once it resolves — don't call
  // reconcileCampaignStatus separately here, or you can race the job
  // insert and mark the campaign complete before the job even exists.
  await dispatchWebsiteAnalysis(businessId);

  res.json({ success: true, inserted: contacts.length });
};

// Failure callback from Scraper
exports.handleEnrichmentFailure = async (req, res) => {
  const { jobId, businessId, error } = req.body;

  try {
    const result = await pool.query(
      `UPDATE businesses SET workflow_status = 'failed' WHERE id = $1 RETURNING campaign_id`,
      [businessId],
    );

    if (jobId) {
      // Standardized to the same input-jsonb convention used everywhere
      // else (dispatchWebsiteAnalysis, failJob) instead of a separate
      // error_message column — if that column doesn't exist on your
      // schema this was silently throwing and skipping reconciliation.
      await pool.query(
        `UPDATE automation_jobs
         SET status = 'failed', completed_at = NOW(),
             input = input || jsonb_build_object('error', $2::text)
         WHERE id = $1`,
        [jobId, error || "Unknown enrichment error"],
      );
    }

    if (result.rows.length > 0) {
      await reconcileCampaignStatus(result.rows[0].campaign_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error handling enrichment failure:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};