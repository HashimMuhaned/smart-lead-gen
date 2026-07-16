/**
 * Constructs the search URL and navigates to the Google Maps search page.
 * @param {import('playwright').Page} page 
 * @param {string} industry 
 * @param {string} location 
 */
async function searchGoogleMaps(page, industry, location) {
  console.log("Step 1: Constructing search URL");
  const query = encodeURIComponent(`${industry} ${location}`);
  const searchUrl = `https://www.google.com/maps/search/${query}`;

  console.log(`Navigating to: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  console.log("Step 2: Waiting for results panel to load");
  await page.waitForSelector('a[href*="/place/"]', { timeout: 20000 });
}

module.exports = { searchGoogleMaps };