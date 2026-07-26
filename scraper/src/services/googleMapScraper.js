const { launchBrowser } = require("../browser");
const { searchGoogleMaps } = require("./googleMaps/search");
const { scrollToEnd } = require("./googleMaps/scroll");
const { getBusinessCards } = require("./googleMaps/extractCards");
const { extractBusiness } = require("./googleMaps/extractBusiness");

/**
 * Orchestrates the full Google Maps scraping workflow.
 * Returns { businesses, error } — always returns whatever was successfully
 * scraped so far, even if something failed partway through. `error` is set
 * if the run didn't finish cleanly, so the caller can decide how to report it
 * without losing the partial data.
 */
async function scrape({ industry, location, limit }) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const businesses = [];
  let error = null;

  try {
    await searchGoogleMaps(page, industry, location);
    await scrollToEnd(page, limit);

    const cards = await getBusinessCards(page, limit);
    const totalToScrape = cards.length;

    for (let i = 0; i < totalToScrape; i++) {
      const card = cards[i];
      try {
        console.log(`[${i + 1}/${totalToScrape}] Extracting profile details...`);
        const business = await extractBusiness(page, card);
        businesses.push(business);
      } catch (cardErr) {
        // One bad card shouldn't discard everything else already gathered.
        console.error(`[Card ${i + 1}] Extraction failed, skipping:`, cardErr.message);
      }
      await page.waitForTimeout(800);
    }
  } catch (err) {
    console.error("Critical Orchestrator Scraper Error:", err);
    error = err.message;
  } finally {
    await browser.close();
  }

  return { businesses, error };
}

module.exports = { scrape };