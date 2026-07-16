/**
 * Resolves Playwright locators for all business cards on the page up to the limit.
 * @param {import('playwright').Page} page 
 * @param {number|null} limit 
 * @returns {Promise<import('playwright').Locator[]>}
 */
async function getBusinessCards(page, limit) {
  console.log("Step 4: Fetching card locators");
  const cardsLocator = page.locator('a[href*="/place/"]');
  const finalCount = await cardsLocator.count();
  const targetLimit = limit ? Math.min(finalCount, limit) : finalCount;

  const cardLocators = [];
  for (let i = 0; i < targetLimit; i++) {
    cardLocators.push(cardsLocator.nth(i));
  }
  return cardLocators;
}

module.exports = { getBusinessCards };