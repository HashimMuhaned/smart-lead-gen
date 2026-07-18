const { scrape } = require("../services/googleMapScraper");
const axios = require("axios");

// Your main backend URL (fallback to localhost if env isn't set)
const BACKEND_URL = "https://smart-lead-gen-backend.vercel.app/";

exports.scrapeGoogleMaps = async (req, res) => {
  const { jobId, campaignId, industry, location, limit } = req.body;

  if (!jobId || !campaignId) {
    return res.status(400).json({
      success: false,
      message: "Missing jobId or campaignId to track background progress.",
    });
  }

  // 1. Instantly respond to the caller (n8n or backend) to prevent timeouts
  res.status(202).json({
    success: true,
    jobId,
    campaignId,
    message: "Scraper task successfully queued on server.",
  });

  // 2. Execute the long-running scraping task asynchronously in the background
  (async () => {
    console.log(`[Job ${jobId}] Initializing background scraping execution...`);
    
    try {
      // Notify backend that the job is now active
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);
      console.log(`[Job ${jobId}] Status successfully marked as 'running' on backend.`);

      // Perform the actual scraping operation
      const businesses = await scrape({
        industry,
        location,
        limit,
      });

      console.log(`[Job ${jobId}] Successfully scraped ${businesses.length} records. Sending payload to backend...`);

      // Send the bulk businesses payload back to the backend
      const response = await axios.post(`${BACKEND_URL}/api/businesses/bulk`, {
        jobId,
        campaignId,
        businesses,
      });

      console.log(`[Job ${jobId}] Bulk database insertion successful:`, response.data);

      // Complete the job lifecycle
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`);
      console.log(`[Job ${jobId}] Job marked as 'completed' successfully!`);

    } catch (error) {
      console.error(`[Critical Background Error] Job ${jobId} failed:`, error.message);
      
      // Notify backend of the failure so your pipeline doesn't hang forever
      try {
        await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/fail`, {
          error: error.message,
        });
        console.log(`[Job ${jobId}] Status successfully marked as 'failed' on backend.`);
      } catch (notifyError) {
        console.error(`Failed to notify backend of job ${jobId} failure:`, notifyError.message);
      }
    }
  })();
};