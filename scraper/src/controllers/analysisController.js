// scraper/src/controllers/analysisController.js

const axios = require("axios");
const {
  crawlWebsite,
  analyzeAndGenerateEmail,
} = require("../services/websiteAnalyzer");

const BACKEND_URL = "https://smart-lead-gen-backend.vercel.app";

exports.analyzeBusiness = async (req, res) => {
  const { jobId, business, contact } = req.body;

  if (!jobId || !business) {
    return res.status(400).json({
      success: false,
      message: "Missing jobId or business data.",
    });
  }

  // 1. Instant acknowledgment to keep HTTP request short
  res.status(202).json({
    success: true,
    jobId,
    message: "Website analysis and email generation task queued.",
  });

  // 2. Background Execution Pipeline
  (async () => {
    let scrapedData = null;
    try {
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);
      if (business.website) scrapedData = await crawlWebsite(business.website);

      const aiResults = await analyzeAndGenerateEmail({
        business,
        contact,
        scrapedData,
      });

      await axios.post(`${BACKEND_URL}/api/businesses/analysis-results`, {
        jobId,
        businessId: business.id,
        campaignId: business.campaign_id,
        contactId: contact ? contact.id : null,
        analysis: aiResults,
      });
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`);
    } catch (err) {
      console.error(`[Analysis Error] Job ${jobId} failed:`, err.message);

      // Persist whatever we gathered instead of losing it — lets you see
      // "crawl succeeded, AI step failed" vs "couldn't reach the site at all"
      try {
        await axios.post(`${BACKEND_URL}/api/businesses/analysis-results`, {
          jobId,
          businessId: business.id,
          campaignId: business.campaign_id,
          contactId: contact ? contact.id : null,
          partial: true,
          analysis: {
            detectedProblems: [
              scrapedData
                ? `Crawled site but analysis step failed: ${err.message}`
                : `Could not analyze website: ${err.message}`,
            ],
            recommendedServices: [],
            aiScore: null,
            emailSubject: "",
            emailBody: "",
          },
        });
      } catch (saveErr) {
        console.error(
          `[Job ${jobId}] Failed to persist partial result:`,
          saveErr.message,
        );
      }

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
