const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

/**
 * Searches Google for indexed Apollo.io profile snippets to find email and phone numbers.
 */
async function searchApolloContactInfo({ firstName, lastName, companyName }) {
  if (!SERPAPI_KEY || !firstName || firstName === "Unknown")
    return { email: null, phone: null };

  const fullName = `${firstName} ${lastName}`.trim();
  const query = `site:apollo.io/people/ "${fullName}" "${companyName}"`;

  console.log(`[SerpApi Apollo] Searching Apollo dork: ${query}`);

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        api_key: SERPAPI_KEY,
        num: 3,
      },
    });

    const organicResults = response.data.organic_results || [];
    let extractedEmail = null;
    let extractedPhone = null;

    // Common non-target domain emails to ignore
    const ignoredDomains = [
      "apollo.io",
      "sentry.io",
      "google.com",
      "schema.org",
      "w3.org",
    ];

    for (const item of organicResults) {
      const textToSearch = `${item.title || ""} ${item.snippet || ""}`;

      // 1. Regex to extract Email addresses
      if (!extractedEmail) {
        const emailMatches = textToSearch.match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        );
        if (emailMatches) {
          const validEmail = emailMatches.find((email) => {
            const domain = email.split("@")[1]?.toLowerCase();
            return (
              domain &&
              !ignoredDomains.some((ignored) => domain.includes(ignored))
            );
          });
          if (validEmail) {
            extractedEmail = validEmail.toLowerCase();
          }
        }
      }

      // 2. Regex to extract Phone numbers (international & local formats)
      if (!extractedPhone) {
        const phoneMatch = textToSearch.match(
          /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/,
        );
        if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 7) {
          extractedPhone = phoneMatch[0].trim();
        }
      }

      if (extractedEmail && extractedPhone) break;
    }

    return { email: extractedEmail, phone: extractedPhone };
  } catch (err) {
    console.warn(
      `[SerpApi Apollo] Search failed for ${fullName}:`,
      err.message,
    );
    return { email: null, phone: null };
  }
}

/**
 * Uses SerpApi Google Search engine to query LinkedIn profiles for business decision makers,
 * then enriches each found contact via indexed Apollo profiles.
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

  const targetName = companyName || name;
  const targetLocation = location || [city, country].filter(Boolean).join(" ");

  const query = `site:linkedin.com/in/ "${targetName}" ${targetLocation} ("CEO" OR "Owner" OR "Founder" OR "Managing Director" OR "Manager" OR "Doctor")`;

  console.log(`[SerpApi LinkedIn] Searching Google query: ${query}`);

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

      let rawTitle = (item.title || "")
        .replace(/\s*\|\s*LinkedIn$/i, "")
        .trim();

      const parts = rawTitle.split(/\s+[\-\–\—]\s+/);

      let fullName = "Unknown";
      let jobTitle = "Decision Maker";

      if (parts.length >= 2) {
        fullName = parts[0].replace(/dr\.?/i, "").trim();
        jobTitle = parts.slice(1).join(" - ").trim();
      } else {
        fullName = rawTitle.replace(/dr\.?/i, "").trim();
      }

      jobTitle = jobTitle.replace(/\s*\.{2,3}$/, "").trim();

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "";

      // --- APOLLO ENRICHMENT STEP ---
      console.log(
        `[Enrichment] Attempting Apollo search for: ${firstName} ${lastName} (${targetName})`,
      );
      const { email, phone } = await searchApolloContactInfo({
        firstName,
        lastName,
        companyName: targetName,
      });

      contacts.push({
        firstName,
        lastName,
        jobTitle,
        email,
        phone,
        linkedinUrl: item.link,
        source: email || phone ? "serpapi_linkedin_apollo" : "serpapi_linkedin",
        confidenceScore: email ? 85 : 70,
      });
    }

    return contacts;
  } catch (error) {
    console.error("[SerpApi Error] Execution failed:", error.message);
    return [];
  }
}

module.exports = { findDecisionMakers };
