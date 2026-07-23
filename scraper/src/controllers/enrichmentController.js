const axios = require("axios");
const { findDecisionMakers } = require("../services/serpApiEnrichment");

const BACKEND_URL = "https://smart-lead-gen-backend.vercel.app/";

// scraper/src/controllers/enrichmentController.js

exports.enrichContact = async (req, res) => {
  const { jobId, businessId } = req.body;

  // Acknowledge receipt to backend immediately
  res.json({ success: true, message: "Enrichment job started" });

  try {
    // 1. Mark job as running in DB
    await pool.query(
      "UPDATE automation_jobs SET status = 'running' WHERE id = $1",
      [jobId],
    );

    // 2. Fetch business name & location for search query
    const bRes = await pool.query(
      "SELECT name, address FROM businesses WHERE id = $1",
      [businessId],
    );

    if (bRes.rows.length === 0) {
      throw new Error(`Business not found: ${businessId}`);
    }

    const { name, address } = bRes.rows[0];

    // 3. Query SerpApi safely
    let contacts = [];
    try {
      contacts = await fetchLinkedInContactsSerpApi(name, address);
    } catch (serpErr) {
      console.error(
        `SerpApi call failed for business ${businessId}:`,
        serpErr.message,
      );
      // Fallback: proceed with empty contacts array instead of crashing
      contacts = [];
    }

    // 4. ALWAYS post back to main backend to advance workflow state
    await axios.post(`${process.env.BACKEND_URL}/api/contacts/bulk`, {
      businessId,
      contacts: contacts || [],
    });

    // 5. Mark job as completed
    await pool.query(
      "UPDATE automation_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [jobId],
    );
  } catch (err) {
    console.error(`[Enrichment Error] Job ${jobId} failed:`, err.message);

    // Update job status to failed
    await pool.query(
      `UPDATE automation_jobs 
       SET status = 'failed', completed_at = NOW(), input = jsonb_set(COALESCE(input, '{}'::jsonb), '{error}', $1)
       WHERE id = $2`,
      [JSON.stringify(err.message), jobId],
    );

    // FAILSAFE: Call backend error webhook so business workflow_status doesn't get stuck
    try {
      await axios.post(
        `${process.env.BACKEND_URL}/api/contacts/enrichment-failed`,
        {
          businessId,
          error: err.message,
        },
      );
    } catch (webhookErr) {
      console.error(
        "Failed to notify backend of job failure:",
        webhookErr.message,
      );
    }
  }
};
