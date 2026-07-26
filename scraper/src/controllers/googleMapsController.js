const { scrape } = require("../services/googleMapScraper");
const { crawlWebsiteForContacts } = require("../services/firecrawlCrawler");
const axios = require("axios");

const BACKEND_URL =
  process.env.BACKEND_URL || "https://smart-lead-gen-backend.vercel.app";

exports.scrapeGoogleMaps = async (req, res) => {
  const { jobId, campaignId, industry, location, limit } = req.body;

  if (!jobId || !campaignId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Missing jobId or campaignId to track background progress.",
      });
  }

  res
    .status(202)
    .json({
      success: true,
      jobId,
      campaignId,
      message: "Scraper task successfully queued on server.",
    });

  (async () => {
    console.log(`[Job ${jobId}] Initializing background scraping execution...`);

    try {
      await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/start`);

      const { businesses, error: scrapeError } = await scrape({
        industry,
        location,
        limit,
      });
      console.log(
        `[Job ${jobId}] Scraped ${businesses.length} maps records${scrapeError ? ` (run stopped early: ${scrapeError})` : ""}. Starting website crawling...`,
      );

      for (let i = 0; i < businesses.length; i++) {
        const biz = businesses[i];
        let mergedPhones = biz.phone ? [biz.phone] : [];
        let mergedEmails = [];

        if (biz.website) {
          try {
            console.log(`[Job ${jobId}] Crawling ${biz.website}...`);
            const { emails, phones } = await crawlWebsiteForContacts(
              biz.website,
            );
            mergedEmails.push(...emails);
            mergedPhones.push(...phones);
          } catch (crawlErr) {
            // Don't let one broken site cost you every business after it.
            console.error(
              `[Job ${jobId}] Contact crawl failed for ${biz.website}:`,
              crawlErr.message,
            );
          }
        }

        biz.phone = [...new Set(mergedPhones.filter(Boolean))];
        biz.email = [...new Set(mergedEmails.filter(Boolean))];
      }

      console.log(
        `[Job ${jobId}] Crawling complete. Sending payload to backend...`,
      );

      if (businesses.length > 0) {
        const response = await axios.post(
          `${BACKEND_URL}/api/businesses/bulk`,
          { jobId, campaignId, businesses },
        );
        console.log(
          `[Job ${jobId}] Bulk database insertion successful:`,
          response.data,
        );
      }

      if (scrapeError) {
        // We still saved whatever we found above — this just makes sure
        // the job (and campaign) accurately reflect that it was a
        // degraded/partial run, not a clean success.
        await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/fail`, {
          error: scrapeError,
        });
      } else {
        await axios.patch(
          `${BACKEND_URL}/api/campaigns/jobs/${jobId}/complete`,
        );
      }
    } catch (error) {
      console.error(
        `[Critical Background Error] Job ${jobId} failed:`,
        error.message,
      );
      try {
        await axios.patch(`${BACKEND_URL}/api/campaigns/jobs/${jobId}/fail`, {
          error: error.message,
        });
      } catch (notifyError) {
        console.error(
          `Failed to notify backend of job failure:`,
          notifyError.message,
        );
      }
    }
  })();
};
