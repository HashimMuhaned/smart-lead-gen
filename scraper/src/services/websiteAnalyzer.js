const axios = require("axios");
// Import the official Google Gen AI SDK
const { GoogleGenAI } = require("@google/genai");

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const SKYVERN_API_KEY = process.env.SKYVERN_API_KEY;

// Initialize the official client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 1. Crawl Website (Hybrid Approach)
 */
async function crawlWebsite(websiteUrl) {
  if (!websiteUrl) return null;

  try {
    const firecrawlRes = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url: websiteUrl,
        formats: ["markdown", "links"],
        onlyMainContent: true,
      },
      { headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` } }
    );

    if (firecrawlRes.data?.success) {
      return {
        source: "firecrawl",
        markdown: firecrawlRes.data.data.markdown,
        links: firecrawlRes.data.data.links,
      };
    }
  } catch (err) {
    console.warn(`[Firecrawl] Failed for ${websiteUrl}, falling back to Skyvern:`, err.message);
  }

  try {
    const skyvernRes = await axios.post(
      "https://api.skyvern.com/api/v1/jobs",
      {
        url: websiteUrl,
        navigation_goal:
          "Extract main landing page text, check if online booking modal exists, and detect chat widgets.",
      },
      { headers: { Authorization: `Bearer ${SKYVERN_API_KEY}` } }
    );

    return {
      source: "skyvern",
      markdown: skyvernRes.data?.extracted_information || "",
      links: [],
    };
  } catch (err) {
    console.error(`[Skyvern] Failed for ${websiteUrl}:`, err.message);
    return null;
  }
}

/**
 * 2. LLM Analysis & Opportunity Detection + Email Generation
 * Model: gemini-2.5-flash (Official SDK Implementation)
 */
async function analyzeAndGenerateEmail({ business, contact, scrapedData }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const cleanMarkdown = scrapedData?.markdown
    ? scrapedData.markdown.substring(0, 1500).replace(/\s+/g, " ")
    : "No website content.";

  const contactName = contact
    ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
    : "Business Owner";

  const prompt = `Analyze this lead and write a cold outreach email focusing on CRM, automations, or web redesign.

BUSINESS: ${business.name} | Category: ${business.category || "N/A"} | Rating: ${business.google_rating || "N/A"} (${business.review_count || 0} reviews) | Location: ${business.city || ""}, ${business.country || ""}
CONTACT: ${contactName} (${contact?.job_title || "Owner"})
WEBSITE TEXT: ${cleanMarkdown}

OUTPUT JSON ONLY:
{
  "detectedProblems": ["3-4 concise tech/automation issues"],
  "recommendedServices": ["2-3 services e.g. CRM, AI Receptionist, Booking System"],
  "aiScore": integer (0-100),
  "emailSubject": "Short compelling subject line",
  "emailBody": "Personalized, concise outreach email referencing real business details"
}`;

  // Use ai.models.generateContent with official parameters
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite", 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  });

  const rawJsonText = response.text;

  if (!rawJsonText) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(rawJsonText);
}

module.exports = { crawlWebsite, analyzeAndGenerateEmail };
