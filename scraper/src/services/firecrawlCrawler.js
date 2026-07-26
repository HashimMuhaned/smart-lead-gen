const axios = require("axios");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

const CONTACT_PATH_KEYWORDS = [
  "contact", "about", "reach", "connect", "get-in-touch", "support", "team", "location",
];

/**
 * Validates a candidate string as a real phone number using libphonenumber.
 * Rejects things like "4.5", years, IDs, price-looking digit runs.
 * defaultCountry helps parse local-format numbers (no country code) correctly.
 */
function isValidPhone(candidate, defaultCountry = "AE") {
  try {
    const phone = parsePhoneNumberFromString(candidate, defaultCountry);
    return phone && phone.isValid() ? phone.number : null; // normalized E.164
  } catch {
    return null;
  }
}

/**
 * Extracts emails and phones from a page's markdown + link list.
 */
function extractContacts(markdown, links, defaultCountry) {
  const emails = new Set();
  const phones = new Set();

  if (Array.isArray(links)) {
    links.forEach((link) => {
      const url = typeof link === "string" ? link : link?.url;
      if (!url) return;
      if (url.toLowerCase().startsWith("mailto:")) {
        emails.add(url.replace(/mailto:/i, "").split("?")[0].trim().toLowerCase());
      }
      if (url.toLowerCase().startsWith("tel:")) {
        const normalized = isValidPhone(url.replace(/tel:/i, "").trim(), defaultCountry);
        if (normalized) phones.add(normalized);
      }
    });
  }

  if (markdown) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    (markdown.match(emailRegex) || []).forEach((e) => emails.add(e.toLowerCase()));

    // Loose candidate matcher only — real validation happens in isValidPhone.
    // Requires at least one separator or a leading '+', so bare numeric runs
    // (ratings, years, prices, IDs) don't even become candidates.
    const phoneCandidateRegex = /\+?\d[\d\s().-]{6,17}\d/g;
    (markdown.match(phoneCandidateRegex) || []).forEach((raw) => {
      const normalized = isValidPhone(raw.trim(), defaultCountry);
      if (normalized) phones.add(normalized);
    });
  }

  return { emails: Array.from(emails), phones: Array.from(phones) };
}

async function scrapePage(url) {
  try {
    const res = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      { url, formats: ["markdown", "links"], onlyMainContent: false },
      { headers: { Authorization: `Bearer ${FIRECRAWL_KEY}` }, timeout: 20000 },
    );
    if (res.data?.success) return res.data.data;
  } catch (err) {
    console.warn(`[Firecrawl] scrape failed for ${url}:`, err.message);
  }
  return null;
}

/**
 * Uses Firecrawl's /map endpoint to cheaply list a site's URLs, then picks out
 * contact/about-style pages so we're not blind-guessing paths.
 */
async function discoverContactPages(baseUrl) {
  try {
    const res = await axios.post(
      "https://api.firecrawl.dev/v1/map",
      { url: baseUrl },
      { headers: { Authorization: `Bearer ${FIRECRAWL_KEY}` }, timeout: 15000 },
    );
    const links = res.data?.links || [];
    return links
      .filter((link) =>
        CONTACT_PATH_KEYWORDS.some((kw) => link.toLowerCase().includes(kw)),
      )
      .slice(0, 5);
  } catch (err) {
    console.warn(`[Firecrawl] map failed for ${baseUrl}:`, err.message);
    return [];
  }
}

/**
 * Crawls a website's homepage plus any discoverable contact/about pages,
 * merging and deduping emails + validated phone numbers across all of them.
 */
async function crawlWebsiteForContacts(websiteUrl, defaultCountry = "AE") {
  if (!websiteUrl) return { emails: [], phones: [] };

  const contactPages = await discoverContactPages(websiteUrl);

  // Always include the homepage, plus a couple of common guessed paths as a
  // fallback in case /map didn't surface them (e.g. blocked by robots.txt).
  const base = websiteUrl.replace(/\/$/, "");
  const guessedPaths = ["/contact", "/contact-us", "/about", "/about-us"].map(
    (p) => `${base}${p}`,
  );

  const urlsToScrape = Array.from(
    new Set([websiteUrl, ...contactPages, ...guessedPaths]),
  );

  const pages = await Promise.allSettled(urlsToScrape.map(scrapePage));

  const emails = new Set();
  const phones = new Set();

  for (const result of pages) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const { markdown, links } = result.value;
    const found = extractContacts(markdown, links, defaultCountry);
    found.emails.forEach((e) => emails.add(e));
    found.phones.forEach((p) => phones.add(p));
  }

  return { emails: Array.from(emails), phones: Array.from(phones) };
}

module.exports = { crawlWebsiteForContacts };