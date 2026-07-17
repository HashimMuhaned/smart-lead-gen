const pool = require("../db");
// const { startCampaignWorkflow } = require("../services/n8nService");

const { triggerScraperWorkflow } = require("../services/scraperService"); 

exports.createCampaign = async (req, res) => {
  const { userId, campaignName, industry, location, maxLeads } = req.body;

  if (!campaignName || !industry || !location) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const campaignResult = await client.query(
      `
      INSERT INTO campaigns (user_id, name, industry, target_location, status)
      VALUES ($1, $2, $3, $4, 'searching')
      RETURNING *
      `,
      [userId, campaignName, industry, location],
    );

    const campaign = campaignResult.rows[0];

    const jobResult = await client.query(
      `
      INSERT INTO automation_jobs (campaign_id, job_type, status, input)
      VALUES ($1, 'scraping', 'queued', $2)
      RETURNING *
      `,
      [
        campaign.id,
        JSON.stringify({
          industry,
          location,
          maxLeads,
        }),
      ],
    );

    const job = jobResult.rows[0];

    await client.query("COMMIT");

    // Bypassing n8n: Trigger the scraper service directly in the background
    // Since the scraper controller responds in < 1 second, this will be extremely fast!
    await triggerScraperWorkflow({
      jobId: job.id,
      campaignId: campaign.id,
      payload: {
        industry,
        location,
        maxLeads,
      },
    });

    res.json({
      success: true,
      campaign,
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

// ... keep startJob, completeJob, failJob exactly as they are

exports.startJob = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE automation_jobs 
      SET status = 'running' 
      WHERE id = $1
      `,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.completeJob = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE automation_jobs
      SET status='completed', completed_at=NOW()
      WHERE id=$1
      `,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// NEW: Failure handler to catch scrapers that crash mid-run
exports.failJob = async (req, res) => {
  const { id } = req.params;
  const { error } = req.body;

  try {
    await pool.query(
      `
      UPDATE automation_jobs
      SET status = 'failed', completed_at = NOW(), input = input || jsonb_build_object('error', $2::text)
      WHERE id = $1
      `,
      [id, error || "Unknown scraping error"]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};