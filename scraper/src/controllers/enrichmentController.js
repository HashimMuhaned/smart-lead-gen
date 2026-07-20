const axios = require("axios");
const { findDecisionMakers } = require("../services/serpApiEnrichment");

const BACKEND_URL = "https://smart-lead-gen-backend.vercel.app/";

exports.enrichContact = async (req, res) => {
  const { jobId, businessId } = req.body;

  if (!jobId || !businessId) {
    return res.status(400).json({
      success: false,
      message: "Missing jobId or businessId.",
    });
  }

  // 1. Acknowledge receipt instantly to free up dispatch caller
  res.status(202).json({
    success: true,
    jobId,
    businessId,
    message: "Enrichment task queued successfully.",
  });

  // 2. Async Execution Pipeline
  (async () => {
    try {
      // Step 2a: Mark Job as Running
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);
      console.log(`[Job ${jobId}] Enrichment job marked as 'running'.`);

      // Step 2b: Fetch Business Record from Backend
      const bizRes = await axios.get(`${BACKEND_URL}/api/businesses/${businessId}`);
      const business = bizRes.data.business;

      console.log(`[Job ${jobId}] Searching decision makers for: ${business.name}...`);

      // Step 2c: Find Decision Makers using SerpApi
      const contacts = await findDecisionMakers({
        name: business.name,
        city: business.city,
        country: business.country,
      });

      console.log(`[Job ${jobId}] Found ${contacts.length} decision maker contacts.`);

      // Step 2d: Bulk Post Contacts to Backend (Only if matches were found)
      if (contacts.length > 0) {
        await axios.post(`${BACKEND_URL}/api/contacts/bulk`, {
          businessId,
          contacts,
        });
      }

      // Step 2e: Mark Job as Complete
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`);
      console.log(`[Job ${jobId}] Enrichment job marked as 'completed'!`);

    } catch (err) {
      console.error(`[Enrichment Error] Job ${jobId} failed:`, err.message);
      
      // Notify Backend of Job Failure
      try {
        await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/fail`, {
          error: err.message,
        });
      } catch (notifyErr) {
        console.error(`Failed to fail job ${jobId}:`, notifyErr.message);
      }
    }
  })();
};