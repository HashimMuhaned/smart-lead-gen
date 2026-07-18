const pool = require("../db");

exports.insertBusinesses = async (req, res) => {
  const { jobId, campaignId, businesses } = req.body;

  if (!businesses || !Array.isArray(businesses)) {
    return res.status(400).json({
      success: false,
      message: "Payload missing 'businesses' array."
    });
  }

  const client = await pool.connect();
  const startTime = Date.now();

  let insertedCount = 0;
  let skippedCount = 0;

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      // Use ON CONFLICT DO NOTHING to drop duplicate pins inside the same campaign safely
      const result = await client.query(
        `
        INSERT INTO businesses
        (
          campaign_id, name, category, address, city, country, 
          phone, website, google_maps_url, google_rating, 
          review_count, social_links, source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        ]
      );

      // If rows were returned, it's a brand new insert! Proceed with the enrichment queue
      if (result.rows.length > 0) {
        insertedCount++;
        const businessId = result.rows[0].id;

        await client.query(
          `
          INSERT INTO automation_jobs (campaign_id, business_id, job_type, status, input)
          VALUES ($1, $2, 'contact_enrichment', 'queued', $3)
          `,
          [campaignId, businessId, JSON.stringify({ businessId })]
        );
      } else {
        skippedCount++;
      }
    }

    // Point 2: Update campaign total_leads dynamically using the reliable COUNT strategy
    // Point 1: Automatically advance campaign status to 'enriching' now that scraping is finished
    await client.query(
      `
      UPDATE campaigns 
      SET 
        status = 'enriching',
        total_leads = (SELECT COUNT(*)::int FROM businesses WHERE campaign_id = $1),
        updated_at = NOW()
      WHERE id = $1
      `,
      [campaignId]
    );

    // Point 3: Calculate execution parameters for contextual debugging outputs
    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    
    const jobOutput = {
      inserted: insertedCount,
      skipped: skippedCount,
      executionTime,
      source: "google_maps"
    };

    // Store structural log outputs inside our active scraping job row
    await client.query(
      `
      UPDATE automation_jobs
      SET output = $2
      WHERE id = $1
      `,
      [jobId, JSON.stringify(jobOutput)]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      ...jobOutput
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Ingestion Layer Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};