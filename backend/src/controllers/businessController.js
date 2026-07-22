const pool = require("../db");
const axios = require("axios");

// Put your enrichment webhook URL here (save to .env later as N8N_ENRICHMENT_WEBHOOK_URL)
const N8N_ENRICHMENT_WEBHOOK =
  "https://n8nselfhostedautomations.tech/webhook/contact-enrichment";

const SCRAPER_SERVICE_URL =
  process.env.SCRAPER_SERVICE_URL ||
  "https://scrape-service.n8nselfhostedautomations.tech";

exports.insertBusinesses = async (req, res) => {
  const { jobId, campaignId, businesses } = req.body;

  if (!businesses || !Array.isArray(businesses)) {
    return res.status(400).json({
      success: false,
      message: "Payload missing 'businesses' array.",
    });
  }

  const client = await pool.connect();
  const startTime = Date.now();

  let insertedCount = 0;
  let skippedCount = 0;
  const queuedJobsToDispatch = [];

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      // 1. Insert business with default workflow_status 'enriching'
      const result = await client.query(
        `
        INSERT INTO businesses
        (
          campaign_id, name, category, address, city, country, 
          phone, website, google_maps_url, google_rating, 
          review_count, social_links, source, workflow_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'enriching')
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
          business.phone,
          business.website,
          business.google_maps_url,
          business.google_rating,
          business.review_count,
          business.social_links ? JSON.stringify(business.social_links) : null,
          business.source || "google_maps",
        ],
      );

      // 2. If row inserted (not skipped), create its corresponding enrichment job
      if (result.rows.length > 0) {
        insertedCount++;
        const businessId = result.rows[0].id;

        const jobResult = await client.query(
          `
          INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
          VALUES ($1, $2, 'contact_enrichment', 'queued', $3)
          RETURNING id
          `,
          [campaignId, businessId, JSON.stringify({ businessId })],
        );

        // Collect newly created jobs to dispatch to the scraper server
        queuedJobsToDispatch.push({
          jobId: jobResult.rows[0].id,
          businessId: businessId,
        });
      } else {
        skippedCount++;
      }
    }

    // 3. Update campaign status and count
    await client.query(
      `
      UPDATE campaigns 
      SET 
        status = 'enriching',
        total_leads = (SELECT COUNT(*)::int FROM businesses WHERE campaign_id = $1),
        updated_at = NOW()
      WHERE id = $1
      `,
      [campaignId],
    );

    // 4. Record execution log output for the original scraping job
    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    const jobOutput = {
      inserted: insertedCount,
      skipped: skippedCount,
      executionTime,
      source: "google_maps",
    };

    await client.query(
      `
      UPDATE automation_jobs
      SET output = $2
      WHERE id = $1
      `,
      [jobId, JSON.stringify(jobOutput)],
    );

    // 5. Commit everything in a single clean transaction
    await client.query("COMMIT");

    // 6. Return standard response immediately to scraper
    res.json({
      success: true,
      ...jobOutput,
    });

    // 7. Fire-and-forget push dispatcher: Asynchronously notify Scraper Server for each queued job
    if (queuedJobsToDispatch.length > 0) {
      (async () => {
        for (const job of queuedJobsToDispatch) {
          try {
            await axios.post(`${SCRAPER_SERVICE_URL}/contact-enrichment`, {
              jobId: job.jobId,
              businessId: job.businessId,
            });
            console.log(
              `[Push Dispatcher] Triggered contact enrichment on Scraper Server for Job ${job.jobId}`,
            );
          } catch (err) {
            console.error(
              `[Push Dispatcher Error] Failed to trigger Job ${job.jobId}:`,
              err.message,
            );
          }
        }
      })();
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Ingestion Layer Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
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
    return res.status(400).json({
      success: false,
      message: "Missing businessId or analysis payload.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert or Update website_analysis
    const logoInitials = req.body.businessName
      ? req.body.businessName.substring(0, 2).toUpperCase()
      : "BI";

    await client.query(
      `
      INSERT INTO website_analysis 
        (business_id, analysis_status, detected_problems, recommendations, ai_score, logo_initials, logo_color)
      VALUES ($1, 'completed', $2, $3, $4, $5, 'signal')
      ON CONFLICT (id) DO NOTHING
      `,
      [
        businessId,
        JSON.stringify(analysis.detectedProblems || []),
        JSON.stringify(analysis.recommendedServices || []),
        analysis.aiScore || 75,
        logoInitials,
      ],
    );

    // 2. Insert into lead_scores
    await client.query(
      `
      INSERT INTO lead_scores (business_id, score, reasons)
      VALUES ($1, $2, $3)
      `,
      [
        businessId,
        analysis.aiScore || 75,
        JSON.stringify(analysis.detectedProblems || []),
      ],
    );

    // 3. Draft Email in emails table (Pending Human Approval)
    await client.query(
      `
      INSERT INTO emails (campaign_id, business_id, contact_id, subject, body, status)
      VALUES ($1, $2, $3, $4, $5, 'draft')
      `,
      [
        campaignId,
        businessId,
        contactId || null,
        analysis.emailSubject || "Partnership Opportunity",
        analysis.emailBody || "",
      ],
    );

    // 4. Update Business Status
    await client.query(
      `
      UPDATE businesses 
      SET workflow_status = 'analyzed' 
      WHERE id = $1
      `,
      [businessId],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Analysis and email stored successfully.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Save Analysis Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

/**
 * Dispatcher function to send a business + contact to Scraper Server for analysis
 */
exports.dispatchWebsiteAnalysis = async (businessId, contactId = null) => {
  try {
    // Fetch business details
    const bizRes = await pool.query(`SELECT * FROM businesses WHERE id = $1`, [
      businessId,
    ]);
    if (bizRes.rows.length === 0) return;
    const business = bizRes.rows[0];

    // Fetch contact details if available
    let contact = null;
    if (contactId) {
      const contactRes = await pool.query(
        `SELECT * FROM contacts WHERE id = $1`,
        [contactId],
      );
      if (contactRes.rows.length > 0) contact = contactRes.rows[0];
    } else {
      // Grab top contact for this business if not specified
      const topContactRes = await pool.query(
        `SELECT * FROM contacts WHERE business_id = $1 ORDER BY confidence_score DESC LIMIT 1`,
        [businessId],
      );
      if (topContactRes.rows.length > 0) contact = topContactRes.rows[0];
    }

    // Create automation job record
    const jobResult = await pool.query(
      `
      INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
      VALUES ($1, $2, 'website_analysis', 'queued', $3)
      RETURNING id
      `,
      [
        business.campaign_id,
        businessId,
        JSON.stringify({ businessId, contactId }),
      ],
    );

    const jobId = jobResult.rows[0].id;

    // Trigger Scraper Server asynchronously
    await axios.post(`${SCRAPER_SERVICE_URL}/website-analysis`, {
      jobId,
      business,
      contact,
    });

    console.log(
      `[Dispatch Analysis] Successfully queued Job ${jobId} for Business ${businessId}`,
    );
  } catch (err) {
    console.error(
      `[Dispatch Analysis Error] Business ${businessId}:`,
      err.message,
    );
  }
};

exports.getBusinesses = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.name,
        COALESCE(b.category, 'General') AS category,
        CONCAT_WS(', ', NULLIF(b.city, ''), NULLIF(b.country, '')) AS location,
        b.website,
        COALESCE(b.phone, 'N/A') AS phone,
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

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location || "Dubai, UAE",
        website: row.website || null,
        phone: row.phone,
        email: row.contact_email || null,
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

        b.google_rating,
        b.review_count,

        b.source,
        b.created_at,
        b.workflow_status,


        -- Contact
        c.email,
        CONCAT_WS(' ',
          NULLIF(c.first_name,''),
          NULLIF(c.last_name,'')
        ) AS contact_person,


        -- Website AI Analysis
        wa.ai_score,
        wa.logo_initials,
        wa.logo_color,
        wa.detected_problems,
        wa.recommendations,


        -- Latest Email
        e.subject,
        e.body


      FROM businesses b


      LEFT JOIN LATERAL (

        SELECT *
        FROM contacts
        WHERE business_id = b.id
        ORDER BY confidence_score DESC
        LIMIT 1

      ) c ON TRUE



      LEFT JOIN website_analysis wa
      ON wa.business_id = b.id



      LEFT JOIN LATERAL (

        SELECT *
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

    const business = {
      id: row.id,

      name: row.name,

      category: row.category || "General",

      location: row.location || "Dubai, UAE",

      website: row.website || null,

      phone: row.phone || "N/A",

      email: row.email || null,

      rating: Number(row.google_rating || 0),

      reviews: Number(row.review_count || 0),

      contactPerson: row.contact_person || "Business Owner",

      aiScore: row.ai_score || 75,

      status:
        row.workflow_status === "analyzed" || row.workflow_status === "enriched"
          ? "Hot Lead"
          : "Discovered",

      logoInitials: row.logo_initials || initials,

      logoColor: row.logo_color || "signal",

      employeeCount: "1-10",

      detectedProblems: row.detected_problems || [],

      recommendedServices: row.recommendations || [],

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
