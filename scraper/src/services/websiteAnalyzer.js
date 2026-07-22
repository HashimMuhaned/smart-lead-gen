const axios = require("axios");

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const SKYVERN_API_KEY = process.env.SKYVERN_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * 1. Crawl Website (Hybrid Approach)
 */
async function crawlWebsite(websiteUrl) {
  if (!websiteUrl) return null;

  // Primary Attempt: Firecrawl (Fast, Clean LLM Markdown)
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

  // Fallback Attempt: Skyvern (Agentic Browser Execution)
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
 * Model: gemini-1.5-flash (Fixed Payload Architecture)
 */
async function analyzeAndGenerateEmail({ business, contact, scrapedData }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  // Trim scraped markdown to 1500 chars to minimize prompt input tokens
  const cleanMarkdown = scrapedData?.markdown
    ? scrapedData.markdown.substring(0, 1500).replace(/\s+/g, " ")
    : "No website content.";

  const contactName = contact
    ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
    : "Business Owner";

  // Highly concise prompt optimized for low token overhead
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

  // Using the completely stable production endpoint for gemini-1.5-flash
  const geminiEndpoint = `https://googleapis.com{GEMINI_API_KEY}`;

  // FIXED: Adjusted payload tree to make generationConfig a top-level property beside contents
  const response = await axios.post(
    geminiEndpoint, 
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json", 
        temperature: 0.2, 
        maxOutputTokens: 800, 
      },
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const rawJsonText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJsonText) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(rawJsonText);
}

module.exports = { crawlWebsite, analyzeAndGenerateEmail };