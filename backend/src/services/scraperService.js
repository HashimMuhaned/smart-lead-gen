// backend/src/services/scraperService.js (or replace content in n8nService.js)
const axios = require("axios");

const SCRAPER_URL = "https://scrape-service.n8nselfhostedautomations.tech/google-maps";

async function triggerScraperWorkflow({ jobId, campaignId, payload }) {
  console.log(`[Backend] Directly triggering Scraper for Job ${jobId}...`);

  try {
    // We send a POST request directly to your self-hosted scraper
    const response = await axios.post(SCRAPER_URL, {
      jobId,
      campaignId,
      industry: payload.industry,
      location: payload.location,
      limit: parseInt(payload.maxLeads, 10) || null
    });

    console.log("[Backend] Scraper acknowledged start:", response.data);
    return response.data;
  } catch (error) {
    console.error("[Backend Error] Failed to directly trigger scraper:", error.message);
    throw error;
  }
}

module.exports = {
  triggerScraperWorkflow,
};