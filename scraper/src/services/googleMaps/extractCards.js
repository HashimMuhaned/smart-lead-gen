/**
 * Extracts static metadata (name, href, rating, review count) for every
 * business card in ONE pass, directly from the DOM, instead of returning
 * live Locators.
 *
 * This matters because Google Maps rewrites card hrefs as you interact
 * with the map, and Playwright Locators built with .nth(i) re-resolve
 * live against the current DOM. Combined, clicking through cards later
 * (one at a time) could silently click the wrong element or fail to
 * navigate at all — which is what was causing website/phone/email to get
 * stuck repeating the first business's data across every subsequent lead.
 * Capturing everything up front, then navigating via direct URL per
 * business, removes that failure mode entirely.
 */
async function getBusinessCards(page, limit) {
  console.log("Step 4: Fetching card metadata");

  const feedExists = (await page.locator('div[role="feed"]').count()) > 0;
  const rootSelector = feedExists
    ? 'div[role="feed"] a[href*="/place/"]'
    : 'a[href*="/place/"]';

  const rawCards = await page.$$eval(rootSelector, (elements) => {
    return elements.map((el) => {
      // Walk up to the card's container to search for rating/review info
      // that lives alongside the anchor, not on it directly.
      const container = el.closest("div[jsaction]") || el.parentElement || el;

      const ratingEl = container.querySelector(
        'span[aria-label*="star"], span[aria-label*="rating"]',
      );
      const reviewEl = container.querySelector(
        'span[aria-label*="review"], span[aria-label*="opinions"]',
      );

      return {
        name: el.getAttribute("aria-label") || null,
        href: el.getAttribute("href") || null,
        ratingLabel: ratingEl ? ratingEl.getAttribute("aria-label") : null,
        reviewLabel: reviewEl ? reviewEl.getAttribute("aria-label") : null,
        cardText: container.innerText || null,
      };
    });
  });

  // De-dupe by href — Maps sometimes renders more than one anchor
  // pointing at the same place within a card's subtree.
  const seen = new Set();
  const deduped = [];
  for (const c of rawCards) {
    if (!c.href || seen.has(c.href)) continue;
    seen.add(c.href);
    deduped.push(c);
    if (limit && deduped.length >= limit) break;
  }

  console.log(`Step 4: Captured metadata for ${deduped.length} cards`);
  return deduped;
}

module.exports = { getBusinessCards };