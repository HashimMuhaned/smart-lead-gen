const { parseAddress, cleanText } = require("./utils");

/**
 * Extracts all profile details for a single business card (including fallback ratings & social profiles).
 * @param {import('playwright').Page} page
 * @param {import('playwright').Locator} card
 * @returns {Promise<object>}
 */
async function extractBusiness(page, card) {
  // Bring card into layout focus before taking action
  await card.scrollIntoViewIfNeeded().catch(() => {});

  const name = (await card.getAttribute("aria-label")) || "Unknown Business";
  const googleMapsUrl = await card.getAttribute("href");

  let rating = null;
  let reviewCount = null;

  // --- STRATEGY 1: Extract ratings/reviews from the LEFT PREVIEW CARD ---
  try {
    const ratingElement = card
      .locator('span[aria-label*="stars"], span[aria-label*="star"]')
      .first();
    if (await ratingElement.isVisible()) {
      const rawLabel = await ratingElement.getAttribute("aria-label");
      const ratingMatch = rawLabel.match(/(\d[\.,]\d)/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1].replace(",", "."));
      }
    }

    const reviewElement = card
      .locator('span[aria-label*="review"], span[aria-label*="opinions"]')
      .first();
    if (await reviewElement.isVisible()) {
      const rawReviews = await reviewElement.getAttribute("aria-label");
      const countMatch = rawReviews.match(/(\d[\d,\.]*)/);
      if (countMatch) {
        reviewCount = parseInt(countMatch[1].replace(/[\.,]/g, ""), 10);
      }
    }
  } catch (e) {
    console.warn(
      `[${name}] Card preview metrics fallback triggered:`,
      e.message,
    );
  }

  // Details fields
  let category = null;
  let address = null;
  let phone = null;
  let website = null;
  let social_links = {};

  try {
    // 1. Click to trigger dynamic sidebar hydration
    await card.click();

    // 2. Wait for sidebar panel container to render and stabilize
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.waitForTimeout(1000); // Safety buffer for dynamic JS rendering

    // --- STRATEGY 2: Failsafe Backup for Ratings inside the SIDEBAR ---
    // --- STRATEGY 2: Failsafe Backup for Ratings inside the SIDEBAR ---
    if (!rating || !reviewCount) {
      try {
        // Find the rating container
        const sidebarRatingContainer = page
          .locator('div[class*="F7nice"]')
          .first();

        // Pass a short timeout to isVisible so it doesn't wait 30s
        if (await sidebarRatingContainer.isVisible({ timeout: 2000 })) {
          const ratingEl = sidebarRatingContainer
            .locator('span[aria-hidden="true"]')
            .first();
          if (await ratingEl.isVisible({ timeout: 1000 })) {
            const ratingText = await ratingEl.innerText();
            if (ratingText && !isNaN(parseFloat(ratingText))) {
              rating = parseFloat(ratingText.trim().replace(",", "."));
            }
          }

          const reviewEl = sidebarRatingContainer
            .locator('span[aria-label*="review"], span[aria-label*="opinions"]')
            .first();

          if (await reviewEl.isVisible({ timeout: 1000 })) {
            const sidebarReviewsText = await reviewEl.getAttribute(
              "aria-label",
              { timeout: 1000 },
            );
            if (sidebarReviewsText) {
              const countMatch = sidebarReviewsText.match(/(\d[\d,\.]*)/);
              if (countMatch) {
                reviewCount = parseInt(countMatch[1].replace(/[\.,]/g, ""), 10);
              }
            }
          }
        }
      } catch (sidebarMetricsErr) {
        console.warn(
          `[${name}] Sidebar metrics fallback skipped (Timeout/Not present)`,
        );
      }
    }

    // 3. Robust Category extraction
    const categorySelectors = [
      'button[jsaction*="pane.rating.category"]',
      'span[class*="fontBodyMedium"] button',
      ".fontBodyMedium",
    ];
    for (const selector of categorySelectors) {
      const catEl = page.locator(selector).first();
      if (await catEl.isVisible()) {
        category = (await catEl.innerText()).trim();
        if (category) break;
      }
    }

    // 4. Robust Address extraction
    const addressSelectors = [
      'button[data-item-id="address"]',
      '[data-tooltip*="Copy address"]',
      '[data-item-id*="address"]',
      'button[aria-label*="Address:"]',
    ];
    for (const selector of addressSelectors) {
      const addEl = page.locator(selector).first();
      if (await addEl.isVisible()) {
        address = (await addEl.innerText()).trim();
        if (address) break;
      }
    }

    // 5. Robust Phone extraction
    const phoneSelectors = [
      'button[data-item-id^="phone:tel:"]',
      '[data-tooltip*="Copy phone number"]',
      'button[aria-label*="Phone:"]',
      'button[data-item-id*="phone"]',
    ];
    for (const selector of phoneSelectors) {
      const phoneEl = page.locator(selector).first();
      if (await phoneEl.isVisible()) {
        phone = (await phoneEl.innerText()).trim();
        if (phone) break;
      }
    }

    // 6. Robust Website extraction
    const websiteSelectors = [
      'a[data-item-id="authority"]',
      'a[aria-label*="Website:"]',
      'a[data-tooltip*="Open website"]',
      'a[href^="http"]:not([href*="google.com"])',
    ];
    for (const selector of websiteSelectors) {
      const webEl = page.locator(selector).first();
      if (await webEl.isVisible()) {
        const href = await webEl.getAttribute("href");
        if (href && !href.includes("google.com/maps")) {
          website = href;
          break;
        }
      }
    }

    // 7. Social Profile Links extraction
    const rawLinks = await page
      .locator(
        'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="youtube.com"], a[href*="x.com"]',
      )
      .all();
    for (const linkEl of rawLinks) {
      const href = await linkEl.getAttribute("href");
      if (href) {
        if (href.includes("facebook.com")) social_links.facebook = href;
        else if (href.includes("instagram.com")) social_links.instagram = href;
        else if (href.includes("linkedin.com")) social_links.linkedin = href;
        else if (href.includes("twitter.com") || href.includes("x.com"))
          social_links.twitter = href;
        else if (href.includes("youtube.com")) social_links.youtube = href;
      }
    }
  } catch (detailError) {
    console.warn(
      `Could not extract full sidebar details for "${name}":`,
      detailError.message,
    );
  }

  // Parse location components using helpers
  const { city, country } = parseAddress(address);

  // Return standard schema
  // Return standard schema with clean data
  return {
    name: cleanText(name) || "Unknown Business",
    category: cleanText(category),
    address: cleanText(address),
    city: cleanText(city),
    country: cleanText(country),
    phone: cleanText(phone),
    website: website, // Keep raw website URL intact
    google_maps_url: googleMapsUrl, // Keep raw Google Maps URL intact
    google_rating: rating, // Numeric, no cleaning needed
    review_count: reviewCount, // Numeric, no cleaning needed
    social_links: social_links, // PASS RAW OBJECT - Removed cleanText wrapper
    source: "google_maps",
  };
}

module.exports = { extractBusiness };
