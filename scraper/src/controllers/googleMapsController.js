const { scrape } = require("../services/googleMapScraper");
const { crawlWebsiteForContacts } = require("../services/firecrawlCrawler");
const axios = require("axios");

const BACKEND_URL = process.env.BACKEND_URL || "https://smart-lead-gen-backend.vercel.app";

exports.scrapeGoogleMaps = async (req, res) => {
  const { jobId, campaignId, industry, location, limit } = req.body;

  if (!jobId || !campaignId) {
    return res.status(400).json({
      success: false,
      message: "Missing jobId or campaignId to track background progress.",
    });
  }

  // 1. Instantly respond to prevent timeouts
  res.status(202).json({
    success: true,
    jobId,
    campaignId,
    message: "Scraper task successfully queued on server.",
  });

  // 2. Execute long-running task asynchronously
  (async () => {
    console.log(`[Job ${jobId}] Initializing background scraping execution...`);
    
    try {
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);
      
      // Perform Google Maps scraping
      const businesses = await scrape({ industry, location, limit });
      console.log(`[Job ${jobId}] Scraped ${businesses.length} maps records. Starting website crawling...`);

      // 3. Firecrawl Website Extraction
      for (let i = 0; i < businesses.length; i++) {
        const biz = businesses[i];
        
        // Initialize arrays (convert Google Map's single phone string to an array)
        let mergedPhones = biz.phone ? [biz.phone] : [];
        let mergedEmails = [];

        if (biz.website) {
          console.log(`[Job ${jobId}] Crawling ${biz.website}...`);
          const { emails, phones } = await crawlWebsiteForContacts(biz.website);
          
          mergedEmails.push(...emails);
          mergedPhones.push(...phones);
        }

        // Deduplicate and reassign to the business object
        biz.phone = [...new Set(mergedPhones.filter(Boolean))];
        biz.email = [...new Set(mergedEmails.filter(Boolean))];
      }

      console.log(`[Job ${jobId}] Crawling complete. Sending payload to backend...`);

      // 4. Send bulk payload back to backend
      const response = await axios.post(`${BACKEND_URL}/api/businesses/bulk`, {
        jobId,
        campaignId,
        businesses,
      });

      console.log(`[Job ${jobId}] Bulk database insertion successful:`, response.data);

      // Complete lifecycle
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`);

    } catch (error) {
      console.error(`[Critical Background Error] Job ${jobId} failed:`, error.message);
      
      try {
        await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/fail`, {
          error: error.message,
        });
      } catch (notifyError) {
        console.error(`Failed to notify backend of job failure:`, notifyError.message);
      }
    }
  })();
};