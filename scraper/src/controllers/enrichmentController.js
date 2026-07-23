// scraper/src/controllers/enrichmentController.js
const axios = require("axios");
const { findDecisionMakers } = require("../services/serpApiEnrichment");

const BACKEND_URL = "https://smart-lead-gen-backend.vercel.app";

exports.enrichContact = async (req, res) => {
  const { jobId, businessId, companyName, location } = req.body;

  // 1. Acknowledge receipt to main backend immediately
  res.json({ success: true, message: "Enrichment job received" });

  try {
    // 2. Safely fetch decision makers via SerpApi
    let contacts = [];
    if (companyName) {
      try {
        contacts = await findDecisionMakers(companyName, location || "");
      } catch (serpErr) {
        console.error(
          `[SerpApi Error] Business ${companyName}:`,
          serpErr.message,
        );
        contacts = []; // Fallback gracefully if SerpApi rate-limits or throws
      }
    }

    // 3. Post back results to main backend (ALWAYS succeeds even if contacts is empty)
    await axios.post(`${BACKEND_URL}/api/contacts/bulk`, {
      jobId,
      businessId,
      contacts: contacts || [],
    });
  } catch (err) {
    console.error(`[Enrichment Error] Job ${jobId} failed:`, err.message);

    // 4. Send failure webhook to backend so DB status moves out of 'enriching'
    try {
      await axios.post(`${BACKEND_URL}/api/contacts/enrichment-failed`, {
        jobId,
        businessId,
        error: err.message,
      });
    } catch (webhookErr) {
      console.error(
        "Failed to notify backend of job failure:",
        webhookErr.message,
      );
    }
  }
};
