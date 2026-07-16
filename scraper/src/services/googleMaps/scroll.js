/**
 * Automatically scrolls the Google Maps left feed panel until limit or end-of-results is reached.
 * @param {import('playwright').Page} page 
 * @param {number|null} limit 
 */
async function scrollToEnd(page, limit) {
  console.log("Step 3: Auto-scrolling the results panel");
  const feedLocator = page.locator('div[role="feed"]');
  
  if ((await feedLocator.count()) === 0) return;

  let previousCount = 0;
  let currentCount = 0;
  let reachedEnd = false;
  let scrollAttempts = 0;
  const maxScrollAttempts = 30;

  while (!reachedEnd && scrollAttempts < maxScrollAttempts) {
    currentCount = await page.locator('a[href*="/place/"]').count();
    console.log(`Scroll iteration ${scrollAttempts + 1}: Found ${currentCount} cards...`);

    if (limit && currentCount >= limit) {
      console.log(`Reached requested limit baseline of ${limit} listings.`);
      break;
    }

    if (currentCount === previousCount) {
      await page.waitForTimeout(1500);
      const endOfListText = await page
        .locator('text="You\'ve reached the end of the list."')
        .isVisible();
        
      const recheckedCount = await page.locator('a[href*="/place/"]').count();
      if (endOfListText || recheckedCount === previousCount) {
        console.log("Reached the actual end of Google Maps results.");
        reachedEnd = true;
        break;
      }
    }

    previousCount = currentCount;

    // Scroll the left panel feed
    await feedLocator.first().evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });

    await page.waitForTimeout(2000); // Wait for lazy load
    scrollAttempts++;
  }
}

module.exports = { scrollToEnd };