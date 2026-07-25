const { parseAddress, cleanText } = require("./utils");

/**
 * Robustly parses rating string into float (handles "4.8", "4,8", etc.)
 */
function parseRatingString(str) {
  if (!str) return null;
  const match = str.match(/(\d(?:[\.,]\d)?)/);
  if (match) {
    const val = parseFloat(match[1].replace(",", "."));
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Robustly parses review count string into integer (handles "1,250", "1.250", "1 250", "(45)")
 */
function parseReviewCountString(str) {
  if (!str) return null;
  // Match number sequences including commas, dots, or spaces used as thousand separators
  const match = str.match(/(\d[\d\,\.\s]*)/);
  if (match) {
    // Strip non-digit characters
    const digitsOnly = match[1].replace(/\D/g, "");
    const val = parseInt(digitsOnly, 10);
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Extracts profile details for a business card with multi-layer fallback strategies.
 * @param {import('playwright').Page} page
 * @param {import('playwright').Locator} card
 * @returns {Promise<object>}
 */
async function extractBusiness(page, card) {
  await card.scrollIntoViewIfNeeded().catch(() => {});

  const name = (await card.getAttribute("aria-label")) || "Unknown Business";
  const googleMapsUrl = await card.getAttribute("href");

  let rating = null;
  let reviewCount = null;

  // ==========================================
  // STRATEGY 1: Feed Card Extraction
  // ==========================================
  try {
    // 1A. Try aria-label on rating star container
    const ratingElement = card
      .locator(
        'span[aria-label*="star"], span[aria-label*="rating"], span[role="img"]',
      )
      .first();

    if (await ratingElement.isVisible({ timeout: 500 })) {
      const rawLabel = await ratingElement.getAttribute("aria-label");
      rating = parseRatingString(rawLabel);
    }

    // 1B. Fallback: Parse inner text of rating directly from card if aria-label failed
    if (!rating) {
      const ratingTextEl = card
        .locator('span[class*="MW43ed"], span.MW43ed')
        .first();
      if (await ratingTextEl.isVisible({ timeout: 500 })) {
        rating = parseRatingString(await ratingTextEl.innerText());
      }
    }

    // 1C. Extract Review Count from Feed Card
    const reviewElement = card
      .locator(
        'span[aria-label*="review"], span[aria-label*="opinions"], span[aria-label*="rating"]',
      )
      .first();

    if (await reviewElement.isVisible({ timeout: 500 })) {
      const rawReviews = await reviewElement.getAttribute("aria-label");
      reviewCount = parseReviewCountString(rawReviews);
    }

    // 1D. Fallback: Check parent container text for review count in parentheses, e.g. "(142)"
    if (!reviewCount) {
      const cardText = await card.innerText();
      const parenMatch = cardText.match(/\((\d[\d\,\.\s]*)\)/);
      if (parenMatch) {
        reviewCount = parseReviewCountString(parenMatch[1]);
      }
    }
  } catch (e) {
    console.warn(`[${name}] Feed card rating extraction skipped: ${e.message}`);
  }

  // Details fields
  let category = null;
  let address = null;
  let phone = null;
  let website = null;
  let social_links = {};

  try {
    // Click card to hydrate the full sidebar profile
    await card.click();
    await page.waitForSelector("h1", { timeout: 10000 });

    // ==========================================
    // STRATEGY 2: Sidebar Profile Fallbacks
    // ==========================================
    // If rating or review count were missed on the feed card, extract from open sidebar
    if (!rating || !reviewCount) {
      try {
        // Wait briefly for sidebar header metrics block to populate
        await page.waitForTimeout(800);

        // Sidebar Rating extraction
        if (!rating) {
          const sidebarRatingLocators = [
            'div[class*="F7nice"] span[aria-hidden="true"]',
            'span[aria-label*="stars"]',
            'span[aria-label*="star"]',
            'div.fontBodyMedium span[role="img"]',
          ];

          for (const sel of sidebarRatingLocators) {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 400 })) {
              const text =
                (await el.innerText()) || (await el.getAttribute("aria-label"));
              rating = parseRatingString(text);
              if (rating) break;
            }
          }
        }

        // Sidebar Review Count extraction
        if (!reviewCount) {
          const sidebarReviewLocators = [
            'div[class*="F7nice"] button[aria-label*="review"]',
            'button[aria-label*="reviews"]',
            'button[aria-label*="opinions"]',
            'span[aria-label*="reviews"]',
          ];

          for (const sel of sidebarReviewLocators) {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 400 })) {
              const text =
                (await el.getAttribute("aria-label")) || (await el.innerText());
              reviewCount = parseReviewCountString(text);
              if (reviewCount) break;
            }
          }
        }
      } catch (sidebarErr) {
        console.warn(
          `[${name}] Sidebar metrics fallback skipped: ${sidebarErr.message}`,
        );
      }
    }

    // 3. Category extraction
    const categorySelectors = [
      'button[jsaction*="pane.rating.category"]',
      'button[jsaction*="category"]',
      'span[class*="fontBodyMedium"] button',
      ".fontBodyMedium",
    ];
    for (const selector of categorySelectors) {
      const catEl = page.locator(selector).first();
      if (await catEl.isVisible({ timeout: 300 })) {
        category = (await catEl.innerText()).trim();
        if (category) break;
      }
    }

    // 4. Address extraction
    const addressSelectors = [
      'button[data-item-id="address"]',
      '[data-tooltip*="Copy address"]',
      '[data-item-id*="address"]',
      'button[aria-label*="Address:"]',
    ];
    for (const selector of addressSelectors) {
      const addEl = page.locator(selector).first();
      if (await addEl.isVisible({ timeout: 300 })) {
        address = (await addEl.innerText()).trim();
        if (address) break;
      }
    }

    // 5. Phone extraction
    const phoneSelectors = [
      'button[data-item-id^="phone:tel:"]',
      '[data-tooltip*="Copy phone number"]',
      'button[aria-label*="Phone:"]',
      'button[data-item-id*="phone"]',
    ];
    for (const selector of phoneSelectors) {
      const phoneEl = page.locator(selector).first();
      if (await phoneEl.isVisible({ timeout: 300 })) {
        phone = (await phoneEl.innerText()).trim();
        if (phone) break;
      }
    }

    // 6. Website extraction
    const websiteSelectors = [
      'a[data-item-id="authority"]',
      'a[aria-label*="Website:"]',
      'a[data-tooltip*="Open website"]',
      'a[href^="http"]:not([href*="google.com"])',
    ];
    for (const selector of websiteSelectors) {
      const webEl = page.locator(selector).first();
      if (await webEl.isVisible({ timeout: 300 })) {
        const href = await webEl.getAttribute("href");
        if (href && !href.includes("google.com/maps")) {
          website = href;
          break;
        }
      }
    }

    // 7. Social Links extraction
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
      `Could not extract full details for "${name}": ${detailError.message}`,
    );
  }

  const { city, country } = parseAddress(address);

  return {
    name: cleanText(name) || "Unknown Business",
    category: cleanText(category),
    address: cleanText(address),
    city: cleanText(city),
    country: cleanText(country),
    phone: cleanText(phone),
    website,
    google_maps_url: googleMapsUrl,
    google_rating: rating,
    review_count: reviewCount,
    social_links,
    source: "google_maps",
  };
}

module.exports = { extractBusiness };
