const pool = require("../db");

exports.insertBusinesses = async (req, res) => {
  const {
    jobId,
    campaignId,
    businesses,
  } = req.body;

  if (!businesses || !Array.isArray(businesses)) {
    return res.status(400).json({
      success: false,
      message: "Payload missing 'businesses' array."
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
      // 1. Insert the business record
      const result = await client.query(
        `
        INSERT INTO businesses
        (
          campaign_id,
          name,
          category,
          address,
          city,
          country,
          phone,
          website,
          google_maps_url,
          google_rating,
          review_count,
          social_links,
          source
        )
        VALUES
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
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

      const businessId = result.rows[0].id;

      // 2. Insert corresponding automation job matching your EXACT DB columns
      // We map the job_type, campaign_id, status, and the foreign key business_id column!
      await client.query(
        `
        INSERT INTO automation_jobs
        (
          campaign_id,
          business_id,
          job_type,
          status,
          input
        )
        VALUES
        (
          $1,
          $2,
          'contact_enrichment',
          'queued',
          $3
        )
        `,
        [
          campaignId,
          businessId,
          JSON.stringify({ businessId }), // Storing in input as backup too
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      inserted: businesses.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Insert Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};