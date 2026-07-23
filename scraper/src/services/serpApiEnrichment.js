// scraper/src/services/serpApiEnrichment.js
const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

/**
 * Uses SerpApi Google Search engine to query LinkedIn profiles for business decision makers.
 */
async function findDecisionMakers({
  companyName,
  name,
  location,
  city,
  country,
}) {
  if (!SERPAPI_KEY) {
    console.error("[SerpApi Error] SERPAPI_API_KEY missing in .env");
    return [];
  }

  // Support both legacy params (name, city, country) and new params (companyName, location)
  const targetName = companyName || name;
  const targetLocation = location || [city, country].filter(Boolean).join(" ");

  const query = `site:linkedin.com/in/ "${targetName}" ${targetLocation} ("CEO" OR "Owner" OR "Founder" OR "Managing Director" OR "Manager" OR "Doctor")`;

  console.log(`[SerpApi] Searching Google query: ${query}`);

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        api_key: SERPAPI_KEY,
        num: 5,
      },
    });

    const organicResults = response.data.organic_results || [];
    const contacts = [];

    for (const item of organicResults) {
      if (!item.link || !item.link.includes("linkedin.com/in/")) continue;

      // 1. Strip "| LinkedIn" from the end first
      let rawTitle = (item.title || "")
        .replace(/\s*\|\s*LinkedIn$/i, "")
        .trim();

      // 2. Split by hyphens or dashes (handles -, –, —)
      const parts = rawTitle.split(/\s+[\-\–\—]\s+/);

      let fullName = "Unknown";
      let jobTitle = "Decision Maker";

      if (parts.length >= 2) {
        // First part is usually the name
        fullName = parts[0].replace(/dr\.?/i, "").trim();
        // Join the remaining parts back together so titles with hyphens aren't sliced!
        jobTitle = parts.slice(1).join(" - ").trim();
      } else {
        fullName = rawTitle.replace(/dr\.?/i, "").trim();
      }

      // 3. Clean up trailing ellipses added by Google
      jobTitle = jobTitle.replace(/\s*\.{2,3}$/, "").trim();

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "";

      contacts.push({
        firstName,
        lastName,
        jobTitle,
        email: null,
        phone: null,
        linkedinUrl: item.link,
        source: "serpapi_linkedin",
        confidenceScore: 80,
      });
    }

    return contacts;
  } catch (error) {
    console.error("[SerpApi Error] Execution failed:", error.message);
    return [];
  }
}

module.exports = { findDecisionMakers };
