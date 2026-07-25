const axios = require("axios");

/**
 * Extracts emails and phone numbers from markdown and a list of links.
 */
const extractContacts = (markdown, links) => {
  const emails = new Set();
  const phones = new Set();

  // 1. Prioritize reliable extraction from HTML links (mailto: and tel:)
  if (Array.isArray(links)) {
    links.forEach((link) => {
      const url = typeof link === 'string' ? link : link.url; // Handle depending on Firecrawl links array format
      if (!url) return;
      
      if (url.toLowerCase().startsWith("mailto:")) {
        emails.add(url.replace(/mailto:/i, "").split("?")[0].trim().toLowerCase());
      }
      if (url.toLowerCase().startsWith("tel:")) {
        phones.add(url.replace(/tel:/i, "").trim());
      }
    });
  }

  // 2. Fallback: Regex on the raw markdown content
  if (markdown) {
    // Standard email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = markdown.match(emailRegex);
    if (foundEmails) foundEmails.forEach((e) => emails.add(e.toLowerCase()));

    // Basic phone regex matching international and common formats
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
    const foundPhones = markdown.match(phoneRegex);
    if (foundPhones) {
      foundPhones.forEach((p) => {
        const cleaned = p.replace(/[^\d+]/g, ""); // Keep only digits and '+'
        if (cleaned.length >= 8 && cleaned.length <= 15) phones.add(cleaned);
      });
    }
  }

  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
  };
};

/**
 * Crawls a website to find contact information.
 */
async function crawlWebsiteForContacts(websiteUrl) {
  if (!websiteUrl) return { emails: [], phones: [] };

  try {
    const firecrawlRes = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url: websiteUrl,
        formats: ["markdown", "links"],
        // Set to false: Contact info is often in headers/footers, which 'onlyMainContent' might strip
        onlyMainContent: false, 
      },
      { headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` } }
    );

    if (firecrawlRes.data?.success) {
      const { markdown, links } = firecrawlRes.data.data;
      return extractContacts(markdown, links);
    }
  } catch (err) {
    console.warn(`[Firecrawl] Failed for ${websiteUrl}:`, err.message);
  }

  return { emails: [], phones: [] };
}

module.exports = { crawlWebsiteForContacts };