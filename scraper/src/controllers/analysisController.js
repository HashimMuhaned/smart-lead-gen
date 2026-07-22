const axios = require("axios");
const { crawlWebsite, analyzeAndGenerateEmail } = require("../services/websiteAnalyzer");

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
    try {
      // Mark job as running on backend
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);

      console.log(`[Job ${jobId}] Starting crawling for: ${business.website || business.name}`);

      // Step A: Crawl Website (Firecrawl -> Skyvern fallback)
      let scrapedData = null;
      if (business.website) {
        scrapedData = await crawlWebsite(business.website);
      }

      console.log(`[Job ${jobId}] Running AI reasoning & email generation...`);

      // Step B: AI Reasoning (Opportunity Detection & Personalization)
      const aiResults = await analyzeAndGenerateEmail({
        business,
        contact,
        scrapedData,
      });

      console.log(`[Job ${jobId}] Analysis complete. Posting results to backend...`);

      // Step C: Send results back to main backend
      await axios.post(`${BACKEND_URL}/api/businesses/analysis-results`, {
        jobId,
        businessId: business.id,
        campaignId: business.campaign_id,
        contactId: contact ? contact.id : null,
        analysis: aiResults,
      });

      // Mark job complete
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`);
      console.log(`[Job ${jobId}] Website analysis job completed successfully!`);

    } catch (err) {
      console.error(`[Analysis Error] Job ${jobId} failed:`, err.message);
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