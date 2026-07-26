const { parseAddress, cleanText } = require("./utils");

function parseRatingString(str) {
  if (!str) return null;
  const match = str.match(/(\d(?:[\.,]\d)?)/);
  if (match) {
    const val = parseFloat(match[1].replace(",", "."));
    return isNaN(val) ? null : val;
  }
  return null;
}

function parseReviewCountString(str) {
  if (!str) return null;
  const match = str.match(/(\d[\d\,\.\s]*)/);
  if (match) {
    const digitsOnly = match[1].replace(/\D/g, "");
    const val = parseInt(digitsOnly, 10);
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Extracts full profile details for a business using its captured card
 * metadata (name, href, rating, review count) plus a fresh navigation to
 * its detail page.
 *
 * @param {import('playwright').Page} page
 * @param {{name: string|null, href: string|null, ratingLabel: string|null, reviewLabel: string|null, cardText: string|null}} cardMeta
 * @returns {Promise<object>}
 */
async function extractBusiness(page, cardMeta) {
  const {
    name: cardName,
    href: googleMapsUrl,
    ratingLabel,
    reviewLabel,
    cardText,
  } = cardMeta;
  const name = cardName || "Unknown Business";

  // Rating/review come straight from the feed metadata captured up front —
  // no click needed for these, so they were never affected by the bug.
  let rating = parseRatingString(ratingLabel);
  let reviewCount = parseReviewCountString(reviewLabel);
  if (!reviewCount && cardText) {
    const parenMatch = cardText.match(/\((\d[\d\,\.\s]*)\)/);
    if (parenMatch) reviewCount = parseReviewCountString(parenMatch[1]);
  }

  let category = null;
  let address = null;
  let phone = null;
  let website = null;
  let social_links = {};

  try {
    if (!googleMapsUrl) throw new Error("No href captured for this card");

    // Navigate DIRECTLY to this business's place URL instead of clicking
    // into a shared, mutating feed panel. This is the actual fix: each
    // business now gets a fully isolated page load, so there's no way for
    // a previous business's detail-panel data (website, phone, category,
    // etc.) to leak into the next one.
    const targetUrl = googleMapsUrl.startsWith("http")
      ? googleMapsUrl
      : new URL(googleMapsUrl, page.url()).toString();

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.waitForTimeout(600); // settle buffer for metrics/category/address to hydrate

    // Sanity check: warn (don't fail) if the loaded page's h1 doesn't
    // resemble the name we captured from the feed. Helps catch any future
    // navigation weirdness without silently trusting mismatched data.
    const loadedH1 = await page
      .locator("h1")
      .first()
      .innerText()
      .catch(() => "");
    if (
      loadedH1 &&
      cardName &&
      !loadedH1.toLowerCase().includes(cardName.toLowerCase().slice(0, 10))
    ) {
      console.warn(
        `[Mismatch Warning] Expected "${cardName}" but loaded page shows "${loadedH1}"`,
      );
    }

    const mainPanel = page.locator('div[role="main"]');
    const scope = (await mainPanel.count()) > 0 ? mainPanel.first() : page;

    // Sidebar fallback for rating/review, in case feed metadata missed them
    if (!rating || !reviewCount) {
      try {
        if (!rating) {
          const sidebarRatingLocators = [
            'div[class*="F7nice"] span[aria-hidden="true"]',
            'span[aria-label*="stars"]',
            'span[aria-label*="star"]',
            'div.fontBodyMedium span[role="img"]',
          ];
          for (const sel of sidebarRatingLocators) {
            const el = scope.locator(sel).first();
            if (await el.isVisible({ timeout: 1200 }).catch(() => false)) {
              const text =
                (await el.innerText()) || (await el.getAttribute("aria-label"));
              rating = parseRatingString(text);
              if (rating) break;
            }
          }
        }

        if (!reviewCount) {
          const sidebarReviewLocators = [
            'div[class*="F7nice"] button[aria-label*="review"]',
            'button[aria-label*="reviews"]',
            'button[aria-label*="opinions"]',
            'span[aria-label*="reviews"]',
          ];
          for (const sel of sidebarReviewLocators) {
            const el = scope.locator(sel).first();
            if (await el.isVisible({ timeout: 1200 }).catch(() => false)) {
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

    // Category
    const categorySelectors = [
      'button[jsaction*="pane.rating.category"]',
      'button[jsaction*="category"]',
      'span[class*="fontBodyMedium"] button',
    ];
    for (const selector of categorySelectors) {
      const catEl = scope.locator(selector).first();
      if (await catEl.isVisible({ timeout: 800 }).catch(() => false)) {
        category = (await catEl.innerText()).trim();
        if (category) break;
      }
    }
    if (!category) {
      const catEl = scope.locator(".fontBodyMedium").first();
      if (await catEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = (await catEl.innerText()).trim();
        if (text && text.length <= 40) category = text;
      }
    }

    // Address
    const addressSelectors = [
      'button[data-item-id="address"]',
      '[data-tooltip*="Copy address"]',
      '[data-item-id*="address"]',
      'button[aria-label*="Address:"]',
    ];
    for (const selector of addressSelectors) {
      const addEl = scope.locator(selector).first();
      if (await addEl.isVisible({ timeout: 800 }).catch(() => false)) {
        address = (await addEl.innerText()).trim();
        if (address) break;
      }
    }

    // Phone
    const phoneSelectors = [
      'button[data-item-id^="phone:tel:"]',
      '[data-tooltip*="Copy phone number"]',
      'button[aria-label*="Phone:"]',
      'button[data-item-id*="phone"]',
    ];
    for (const selector of phoneSelectors) {
      const phoneEl = scope.locator(selector).first();
      if (await phoneEl.isVisible({ timeout: 800 }).catch(() => false)) {
        phone = (await phoneEl.innerText()).trim();
        if (phone) break;
      }
    }

    // Website
    const websiteSelectors = [
      'a[data-item-id="authority"]',
      'a[aria-label*="Website:"]',
      'a[data-tooltip*="Open website"]',
    ];
    for (const selector of websiteSelectors) {
      const webEl = scope.locator(selector).first();
      if (await webEl.isVisible({ timeout: 800 }).catch(() => false)) {
        const href = await webEl.getAttribute("href");
        if (href && !href.includes("google.com/maps")) {
          website = href;
          break;
        }
      }
    }
    if (!website) {
      const webEl = scope
        .locator('a[href^="http"]:not([href*="google.com"])')
        .first();
      if (await webEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const href = await webEl.getAttribute("href");
        if (href) website = href;
      }
    }

    // Social links
    const rawLinks = await scope
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
