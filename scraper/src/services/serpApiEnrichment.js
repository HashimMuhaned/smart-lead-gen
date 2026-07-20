const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

/**
 * Uses SerpApi Google Search engine to query LinkedIn profiles for business decision makers.
 */
async function findDecisionMakers({ name, city, country }) {
  if (!SERPAPI_KEY) {
    console.error("[SerpApi Error] SERPAPI_API_KEY missing in .env");
    return [];
  }

  const locationContext = [city, country].filter(Boolean).join(" ");
  const query = `site:linkedin.com/in/ "${name}" ${locationContext} ("CEO" OR "Owner" OR "Founder" OR "Managing Director" OR "Manager" OR "Doctor")`;

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

      // Extract Name and Title from snippet or title
      // Example Title: "Dr. Sarah Ahmed - Managing Director - Royal Crown Dental Clinic | LinkedIn"
      const titleClean = (item.title || "").split("|")[0].split("-");
      const fullName = (titleClean[0] || "").replace(/dr\.?/i, "").trim();
      const jobTitle = titleClean[1] ? titleClean[1].trim() : "Decision Maker";

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "";

      contacts.push({
        firstName,
        lastName,
        jobTitle,
        email: null, // Basic Google search doesn't reveal direct emails, keeps NULL safely
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