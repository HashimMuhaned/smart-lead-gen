const { launchBrowser } = require("../browser");
const { searchGoogleMaps } = require("./googleMaps/search");
const { scrollToEnd } = require("./googleMaps/scroll");
const { getBusinessCards } = require("./googleMaps/extractCards");
const { extractBusiness } = require("./googleMaps/extractBusiness");

/**
 * Orchestrates the full Google Maps scraping workflow.
 */
async function scrape({ industry, location, limit }) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const businesses = [];

  try {
    // 1. Build and navigate to maps URL
    await searchGoogleMaps(page, industry, location);

    // 2. Perform smooth scroll iteration
    await scrollToEnd(page, limit);

    // 3. Grab matches up to target limit
    const cards = await getBusinessCards(page, limit);
    const totalToScrape = cards.length;

    // 4. Iterate and extract detail cards
    for (let i = 0; i < totalToScrape; i++) {
      const card = cards[i];
      
      console.log(`[${i + 1}/${totalToScrape}] Extracting profile details...`);
      const business = await extractBusiness(page, card);
      
      businesses.push(business);

      // Add a slight delay to simulate human timing between clicks
      await page.waitForTimeout(800);
    }

    return businesses;
  } catch (err) {
    console.error("Critical Orchestrator Scraper Error:", err);
  } finally {
    await browser.close();
  }

  return [];
}

module.exports = {
  scrape,
};