const pool = require("../db");

exports.insertBusinesses = async (req, res) => {
  const {
    jobId,

    campaignId,

    businesses,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const business of businesses) {
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
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
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

          business.social_links,

          business.source,
        ],
      );

      const businessId = result.rows[0].id;

      await client.query(
        `
                INSERT INTO automation_jobs
                (
                    campaign_id,
                    job_type,
                    status,
                    input
                )

                VALUES
                (
                    $1,
                    'contact_enrichment',
                    'queued',
                    $2
                )
                `,

        [
          campaignId,

          JSON.stringify({
            businessId,
          }),
        ],
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,

      inserted: businesses.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message,
    });
  } finally {
    client.release();
  }
};
