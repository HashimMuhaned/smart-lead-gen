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
 * Waits for the sidebar to actually update to a NEW business, rather than
 * just waiting for "an h1 to exist" (which is already true from the
 * previous business and resolves instantly, causing a race).
 */
async function waitForPanelUpdate(page, previousH1Text, timeout = 12000) {
  try {
    await page.waitForFunction(
      (prevText) => {
        const el = document.querySelector("h1");
        return (
          !!el &&
          el.innerText.trim().length > 0 &&
          el.innerText.trim() !== prevText
        );
      },
      previousH1Text,
      { timeout },
    );
  } catch {
    // Didn't detect a change in time — fall through and try extraction
    // anyway rather than aborting the whole business.
  }
  // Small settle buffer: h1 updates first, metrics/category/address load
  // fractionally after. This is cheap insurance on top of the real wait above.
  await page.waitForTimeout(500);
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
    const ratingElement = card
      .locator(
        'span[aria-label*="star"], span[aria-label*="rating"], span[role="img"]',
      )
      .first();

    if (await ratingElement.isVisible({ timeout: 500 })) {
      const rawLabel = await ratingElement.getAttribute("aria-label");
      rating = parseRatingString(rawLabel);
    }

    if (!rating) {
      const ratingTextEl = card
        .locator('span[class*="MW43ed"], span.MW43ed')
        .first();
      if (await ratingTextEl.isVisible({ timeout: 500 })) {
        rating = parseRatingString(await ratingTextEl.innerText());
      }
    }

    const reviewElement = card
      .locator(
        'span[aria-label*="review"], span[aria-label*="opinions"], span[aria-label*="rating"]',
      )
      .first();

    if (await reviewElement.isVisible({ timeout: 500 })) {
      const rawReviews = await reviewElement.getAttribute("aria-label");
      reviewCount = parseReviewCountString(rawReviews);
    }

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
    // Capture the CURRENT panel's h1 text before we click, so we can prove
    // the panel actually advanced to this business before reading from it.
    const previousH1Text = await page
      .locator("h1")
      .first()
      .innerText()
      .catch(() => "");

    // Click via the href we already captured rather than the original
    // positional locator. Google Maps virtualizes the feed (detaches
    // off-screen cards), so by the time we reach card #N in the loop, its
    // original nth() index can silently resolve to a different element.
    // href is a stable per-listing identity and avoids that drift.
    if (googleMapsUrl) {
      const stableTarget = page.locator(`a[href="${googleMapsUrl}"]`).first();
      await stableTarget.click({ timeout: 5000 }).catch(async () => {
        // Fall back to the original locator if the href-based one somehow
        // isn't found (e.g. relative vs absolute href mismatch).
        await card.click();
      });
    } else {
      await card.click();
    }

    await page.waitForSelector("h1", { timeout: 10000 });
    await waitForPanelUpdate(page, previousH1Text);

    // Scope detail extraction to the details pane where possible, to avoid
    // accidentally matching unrelated links/text elsewhere on the page
    // (e.g. the still-visible feed list, or Maps UI chrome).
    const mainPanel = page.locator('div[role="main"]');
    const scope = (await mainPanel.count()) > 0 ? mainPanel.first() : page;

    // ==========================================
    // STRATEGY 2: Sidebar Profile Fallbacks
    // ==========================================
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

    // 3. Category extraction
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
    // Last-resort fallback, guarded by length so it can't grab a paragraph
    // of hours/address/description text instead of a short category chip.
    if (!category) {
      const catEl = scope.locator(".fontBodyMedium").first();
      if (await catEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = (await catEl.innerText()).trim();
        if (text && text.length <= 40) category = text;
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
      const addEl = scope.locator(selector).first();
      if (await addEl.isVisible({ timeout: 800 }).catch(() => false)) {
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
      const phoneEl = scope.locator(selector).first();
      if (await phoneEl.isVisible({ timeout: 800 }).catch(() => false)) {
        phone = (await phoneEl.innerText()).trim();
        if (phone) break;
      }
    }

    // 6. Website extraction
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
    // Broad fallback only as an absolute last resort, and scoped to the
    // details panel (not the whole page) to avoid grabbing unrelated links.
    if (!website) {
      const webEl = scope
        .locator('a[href^="http"]:not([href*="google.com"])')
        .first();
      if (await webEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const href = await webEl.getAttribute("href");
        if (href) website = href;
      }
    }

    // 7. Social Links extraction
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
