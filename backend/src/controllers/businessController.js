// backend\src\controllers\businessController.js
const pool = require("../db");
const axios = require("axios");
const { reconcileCampaignStatus } = require("../utils/campaignStatus");

// Put your enrichment webhook URL here (save to .env later as N8N_ENRICHMENT_WEBHOOK_URL)
const N8N_ENRICHMENT_WEBHOOK =
  "https://n8nselfhostedautomations.tech/webhook/contact-enrichment";

const SCRAPER_SERVICE_URL =
  "https://scrape-service.n8nselfhostedautomations.tech";

exports.insertBusinesses = async (req, res) => {
  const { jobId, campaignId, businesses } = req.body;

  if (!businesses || !Array.isArray(businesses)) {
    return res
      .status(400)
      .json({ success: false, message: "Payload missing 'businesses' array." });
  }

  const client = await pool.connect();
  const startTime = Date.now();

  let insertedCount = 0;
  let skippedCount = 0;
  const queuedJobsToDispatch = [];
  let jobOutput = null;

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      const result = await client.query(
        `
        INSERT INTO businesses
        (campaign_id, name, category, address, city, country, phone, email, website,
         google_maps_url, google_rating, review_count, social_links, source, workflow_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'enriching')
        ON CONFLICT (campaign_id, google_maps_url) DO NOTHING
        RETURNING id
        `,
        [
          campaignId,
          business.name,
          business.category,
          business.address,
          business.city,
          business.country,
          JSON.stringify(business.phone || []),
          JSON.stringify(business.email || []),
          business.website,
          business.google_maps_url,
          business.google_rating,
          business.review_count,
          business.social_links ? JSON.stringify(business.social_links) : null,
          business.source || "google_maps",
        ],
      );

      if (result.rows.length > 0) {
        insertedCount++;
        const businessId = result.rows[0].id;

        const jobResult = await client.query(
          `INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
           VALUES ($1, $2, 'contact_enrichment', 'queued', $3) RETURNING id`,
          [campaignId, businessId, JSON.stringify({ businessId })],
        );

        queuedJobsToDispatch.push({
          jobId: jobResult.rows[0].id,
          businessId,
          companyName: business.name,
          location: business.address || business.city || "",
        });
      } else {
        skippedCount++;
      }
    }

    await client.query(
      `UPDATE campaigns SET status = 'enriching',
         total_leads = (SELECT COUNT(*)::int FROM businesses WHERE campaign_id = $1),
         updated_at = NOW() WHERE id = $1`,
      [campaignId],
    );

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    jobOutput = {
      inserted: insertedCount,
      skipped: skippedCount,
      executionTime,
      source: "google_maps_with_firecrawl",
    };

    await client.query(`UPDATE automation_jobs SET output = $2 WHERE id = $1`, [
      jobId,
      JSON.stringify(jobOutput),
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Ingestion Layer Error:", err);
    client.release();
    return res.status(500).json({ success: false, message: err.message });
  }

  client.release();

  // Dispatch is now OUTSIDE the transaction block entirely — a dispatch
  // failure can never trigger a rollback attempt on an already-committed
  // transaction. We also await this fully before responding: this endpoint
  // is called server-to-server by the scraper (already not blocking any
  // end user), and on Vercel, code after res.json() isn't guaranteed to
  // keep running — awaiting first avoids jobs silently never getting
  // dispatched or reconciled.
  if (queuedJobsToDispatch.length > 0) {
    const results = await Promise.allSettled(
      queuedJobsToDispatch.map((job) =>
        axios.post(
          `${SCRAPER_SERVICE_URL}/contact-enrichment`,
          {
            jobId: job.jobId,
            businessId: job.businessId,
            companyName: job.companyName,
            location: job.location,
          },
          { timeout: 15000 },
        ),
      ),
    );

    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      const job = queuedJobsToDispatch[idx];
      if (result.status === "rejected") {
        console.error(
          `[Push Dispatcher Error] Job ${job.jobId}:`,
          result.reason.message,
        );
        await pool.query(
          `UPDATE automation_jobs SET status = 'failed', completed_at = NOW(),
             input = input || jsonb_build_object('error', $2::text) WHERE id = $1`,
          [job.jobId, result.reason.message],
        );
        await pool.query(
          `UPDATE businesses SET workflow_status = 'failed' WHERE id = $1`,
          [job.businessId],
        );
      }
    }
  }

  await reconcileCampaignStatus(campaignId);

  res.json({ success: true, ...jobOutput });
};

exports.getBusinessById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, campaign_id, name, website, city, country, phone, workflow_status FROM businesses WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    res.json({ success: true, business: result.rows[0] });
  } catch (err) {
    console.error("Get Business Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBusinessProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        b.*,
        c.first_name, c.last_name, c.job_title, c.email AS contact_email,
        wa.detected_problems, wa.recommendations, wa.ai_score, wa.logo_initials, wa.logo_color,
        e.subject AS email_subject, e.body AS email_body, e.status AS email_status
      FROM businesses b
      LEFT JOIN contacts c ON c.business_id = b.id
      LEFT JOIN website_analysis wa ON wa.business_id = b.id
      LEFT JOIN emails e ON e.business_id = b.id
      WHERE b.id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    const row = result.rows[0];

    // Format directly to match React Frontend Expectations
    const profile = {
      id: row.id,
      name: row.name,
      category: row.category || "Business",
      location: [row.city, row.country].filter(Boolean).join(", "),
      website: row.website,
      phone: row.phone,
      email: row.contact_email || "No email found",
      rating: row.google_rating,
      reviews: row.review_count || 0,
      contactPerson: row.first_name
        ? `${row.first_name} ${row.last_name || ""}`.trim()
        : "Business Owner",
      aiScore: row.ai_score || 75,
      status:
        row.workflow_status === "enriched" ? "Hot Lead" : row.workflow_status,
      logoInitials: row.logo_initials || row.name.substring(0, 2).toUpperCase(),
      logoColor: row.logo_color || "signal",
      employeeCount: "1-10",
      detectedProblems: row.detected_problems || [],
      recommendedServices: row.recommendations || [],
      emailSubject: row.email_subject || "Partnership Opportunity",
      emailBody: row.email_body || "Generating email...",
      source: row.source || "Google Maps",
      addedAt: new Date(row.created_at).toISOString().split("T")[0],
    };

    res.json({ success: true, business: profile });
  } catch (err) {
    console.error("Fetch Business Details Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Saves AI Analysis & Email Drafts returned from Scraper Server
 */
exports.saveAnalysisResults = async (req, res) => {
  const { jobId, businessId, campaignId, contactId, analysis } = req.body;

  if (!businessId || !analysis) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Missing businessId or analysis payload.",
      });
  }

  const isPartial = !!req.body.partial;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const logoInitials = req.body.businessName
      ? req.body.businessName.substring(0, 2).toUpperCase()
      : "BI";
    const aiScore = analysis.aiScore ?? (isPartial ? null : 75);

    await client.query(
      `INSERT INTO website_analysis
         (business_id, analysis_status, detected_problems, recommendations, ai_score, logo_initials, logo_color)
       VALUES ($1, $2, $3, $4, $5, $6, 'signal')
       ON CONFLICT (id) DO NOTHING`,
      [
        businessId,
        isPartial ? "partial" : "completed",
        JSON.stringify(analysis.detectedProblems || []),
        JSON.stringify(analysis.recommendedServices || []),
        aiScore,
        logoInitials,
      ],
    );

    if (!isPartial) {
      await client.query(
        `INSERT INTO lead_scores (business_id, score, reasons) VALUES ($1, $2, $3)`,
        [businessId, aiScore, JSON.stringify(analysis.detectedProblems || [])],
      );

      await client.query(
        `INSERT INTO emails (campaign_id, business_id, contact_id, subject, body, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')`,
        [
          campaignId,
          businessId,
          contactId || null,
          analysis.emailSubject || "Partnership Opportunity",
          analysis.emailBody || "",
        ],
      );
    }

    await client.query(
      `UPDATE businesses SET workflow_status = $2 WHERE id = $1`,
      [businessId, isPartial ? "analysis_failed" : "analyzed"],
    );

    await client.query("COMMIT");

    // Reconcile before responding — see note in insertBusinesses above.
    if (campaignId) await reconcileCampaignStatus(campaignId);

    res.json({
      success: true,
      message: "Analysis and email stored successfully.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Save Analysis Error:", err);
    try {
      await pool.query(
        `UPDATE businesses SET workflow_status = 'failed' WHERE id = $1`,
        [businessId],
      );
      if (campaignId) await reconcileCampaignStatus(campaignId);
    } catch (e2) {
      console.error(
        "Failed to mark business as failed after save error:",
        e2.message,
      );
    }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

/**
 * Dispatcher function to send a business + contact to Scraper Server for analysis
 */
exports.dispatchWebsiteAnalysis = async (businessId, contactId = null) => {
  let jobId;
  let campaignId;

  try {
    const bizRes = await pool.query(`SELECT * FROM businesses WHERE id = $1`, [
      businessId,
    ]);
    if (bizRes.rows.length === 0) return;
    const business = bizRes.rows[0];
    campaignId = business.campaign_id;

    let contact = null;
    if (contactId) {
      const contactRes = await pool.query(
        `SELECT * FROM contacts WHERE id = $1`,
        [contactId],
      );
      if (contactRes.rows.length > 0) contact = contactRes.rows[0];
    } else {
      const topContactRes = await pool.query(
        `SELECT * FROM contacts WHERE business_id = $1 ORDER BY confidence_score DESC LIMIT 1`,
        [businessId],
      );
      if (topContactRes.rows.length > 0) contact = topContactRes.rows[0];
    }

    const jobResult = await pool.query(
      `INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
       VALUES ($1, $2, 'website_analysis', 'queued', $3) RETURNING id`,
      [
        business.campaign_id,
        businessId,
        JSON.stringify({ businessId, contactId }),
      ],
    );
    jobId = jobResult.rows[0].id;

    // timeout is critical here — without it a hung scraper leaves this job
    // (and the whole campaign) stuck indefinitely.
    await axios.post(
      `${SCRAPER_SERVICE_URL}/website-analysis`,
      { jobId, business, contact },
      { timeout: 15000 },
    );

    console.log(
      `[Dispatch Analysis] Queued Job ${jobId} for Business ${businessId}`,
    );
  } catch (err) {
    console.error(
      `[Dispatch Analysis Error] Business ${businessId}:`,
      err.message,
    );

    if (jobId) {
      await pool.query(
        `UPDATE automation_jobs
         SET status = 'failed', completed_at = NOW(),
             input = input || jsonb_build_object('error', $2::text)
         WHERE id = $1`,
        [jobId, err.message],
      );
    }
    await pool.query(
      `UPDATE businesses SET workflow_status = 'failed' WHERE id = $1`,
      [businessId],
    );
  } finally {
    if (campaignId) await reconcileCampaignStatus(campaignId);
  }
};

businessController.js;

exports.getBusinesses = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.name,
        COALESCE(b.category, 'General') AS category,
        CONCAT_WS(', ', NULLIF(b.city, ''), NULLIF(b.country, '')) AS location,
        b.website,
        b.phone, -- 👈 Removed the COALESCE that was crashing the JSON parser
        b.email AS business_emails,
        b.google_rating AS rating,
        COALESCE(b.review_count, 0) AS reviews,
        COALESCE(b.source, 'Google Maps') AS source,
        b.created_at,
        b.workflow_status,
        -- Contact Info
        c.email AS contact_email,
        CONCAT_WS(' ', NULLIF(c.first_name, ''), NULLIF(c.last_name, '')) AS contact_person_name,
        -- Website Analysis
        wa.ai_score,
        wa.logo_initials,
        wa.logo_color,
        wa.detected_problems,
        wa.recommendations,
        -- Drafted Email
        e.subject AS email_subject,
        e.body AS email_body
      FROM businesses b
      LEFT JOIN LATERAL (
        SELECT email, first_name, last_name 
        FROM contacts 
        WHERE business_id = b.id 
        ORDER BY confidence_score DESC 
        LIMIT 1
      ) c ON TRUE
      LEFT JOIN website_analysis wa ON wa.business_id = b.id
      LEFT JOIN LATERAL (
        SELECT subject, body 
        FROM emails 
        WHERE business_id = b.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) e ON TRUE
      ORDER BY b.created_at DESC;
    `;

    const result = await pool.query(query);

    // Color palette options matching frontend logo color styles
    const logoColors = ["signal", "mint", "sky", "amber", "purple"];

    const formattedBusinesses = result.rows.map((row, index) => {
      // Map workflow_status to LeadStatus type
      let status = "Discovered";
      if (
        row.workflow_status === "analyzed" ||
        row.workflow_status === "enriched"
      ) {
        status = "Hot Lead";
      } else if (row.workflow_status === "enriching") {
        status = "Enriching";
      }

      // Format Date to YYYY-MM-DD
      const addedAt = row.created_at
        ? new Date(row.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // Clean Initials (Fallback to first 2 letters of business name)
      const cleanName = row.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const initials = cleanName
        ? cleanName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "BI";

      // Safely process emails
      const businessEmailArray = Array.isArray(row.business_emails)
        ? row.business_emails
        : [];
      const primaryEmail =
        row.contact_email ||
        (businessEmailArray.length > 0 ? businessEmailArray[0] : null);

      // 👈 Safely process the phone array to match your frontend `phone: string[]` type
      let phoneArray = [];
      if (Array.isArray(row.phone)) {
        phoneArray = row.phone;
      } else if (typeof row.phone === "string" && row.phone.trim() !== "") {
        phoneArray = [row.phone];
      }

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location || "Dubai, UAE",
        website: row.website || null,
        phone: phoneArray, // 👈 Now safely returns an array in JS
        email: primaryEmail,
        rating: row.rating ? parseFloat(row.rating) : 0.0,
        reviews: row.reviews ? parseInt(row.reviews, 10) : 0,
        contactPerson: row.contact_person_name?.trim() || "Business Owner",
        aiScore: row.ai_score ? parseInt(row.ai_score, 10) : 75,
        status: status,
        logoInitials: row.logo_initials || initials,
        logoColor: row.logo_color || logoColors[index % logoColors.length],
        employeeCount: "1-10",
        detectedProblems: row.detected_problems || [],
        recommendedServices: row.recommendations || [],
        emailSubject: row.email_subject || "Partnership Opportunity",
        emailBody: row.email_body || "",
        source: row.source === "google_maps" ? "Google Maps" : row.source,
        addedAt: addedAt,
      };
    });

    res.json({
      success: true,
      businesses: formattedBusinesses,
    });
  } catch (err) {
    console.error("Fetch Businesses Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBusinessDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        b.id,
        b.name,
        b.category,

        CONCAT_WS(', ',
          NULLIF(b.city, ''),
          NULLIF(b.country, '')
        ) AS location,

        b.website,
        b.phone,
        b.email,  -- 👈 Added email column here
        b.google_rating,
        b.review_count,
        b.source,
        b.created_at,
        b.workflow_status,

        -- Aggregated contacts list sorted by confidence score
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'firstName', c.first_name,
                'lastName', c.last_name,
                'jobTitle', c.job_title,
                'email', c.email,
                'phone', c.phone,
                'confidenceScore', c.confidence_score
              )
              ORDER BY c.confidence_score DESC NULLS LAST, c.created_at DESC
            )
            FROM contacts c
            WHERE c.business_id = b.id
          ),
          '[]'::json
        ) AS contacts,

        -- Website AI Analysis
        wa.ai_score,
        wa.logo_initials,
        wa.logo_color,
        wa.detected_problems,
        wa.recommendations,

        -- Latest Email details
        e.id AS email_id,
        e.subject,
        e.body

      FROM businesses b

      LEFT JOIN website_analysis wa
        ON wa.business_id = b.id

      LEFT JOIN LATERAL (
        SELECT id, subject, body
        FROM emails
        WHERE business_id = b.id
        ORDER BY created_at DESC
        LIMIT 1
      ) e ON TRUE

      WHERE b.id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const row = result.rows[0];

    const cleanName = row.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const initials = cleanName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    // Secondary format: Map contacts with fallback fullName property
    const contacts = (row.contacts || []).map((c) => ({
      id: c.id,
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      fullName:
        [c.firstName, c.lastName].filter(Boolean).join(" ") ||
        "Unnamed Contact",
      jobTitle: c.jobTitle || "N/A",
      email: c.email || null,
      phone: c.phone || null,
      confidenceScore: c.confidenceScore || 0,
    }));

    // Primary contact display name for fallback UI fields
    const primaryContactName =
      contacts.length > 0 ? contacts[0].fullName : "Business Owner";

    const business = {
      id: row.id,
      name: row.name,
      category: row.category || "General",
      location: row.location || "Dubai, UAE",
      website: row.website || null,

      // 👇 Phone and Email mapped directly as arrays (defaulting to empty arrays if null)
      phone: Array.isArray(row.phone) ? row.phone : [],
      email: Array.isArray(row.email) ? row.email : [],

      contacts: contacts,
      contactPerson: primaryContactName,
      rating: Number(row.google_rating || 0),
      reviews: Number(row.review_count || 0),
      aiScore: row.ai_score || 75,
      status:
        row.workflow_status === "analyzed" || row.workflow_status === "enriched"
          ? "Hot Lead"
          : "Discovered",
      logoInitials: row.logo_initials || initials,
      logoColor: row.logo_color || "signal",
      employeeCount: `${contacts.length || 1}-${Math.max(10, contacts.length)}`,
      detectedProblems: row.detected_problems || [],
      recommendedServices: row.recommendations || [],
      emailId: row.email_id || null,
      emailSubject: row.subject || "Partnership Opportunity",
      emailBody: row.body || "",
      source: row.source === "google_maps" ? "Google Maps" : row.source,
      addedAt: new Date(row.created_at).toISOString().split("T")[0],
    };

    res.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error("Get Business Details Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
