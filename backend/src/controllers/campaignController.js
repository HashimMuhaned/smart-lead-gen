const pool = require("../db");
const { triggerScraperWorkflow } = require("../services/scraperService");
const { reconcileCampaignStatus } = require("../utils/campaignStatus");

exports.createCampaign = async (req, res) => {
  const { userId, campaignName, industry, location, maxLeads } = req.body;

  if (!campaignName || !industry || !location) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const campaignResult = await client.query(
      `INSERT INTO campaigns (user_id, name, industry, target_location, status)
       VALUES ($1, $2, $3, $4, 'searching') RETURNING *`,
      [userId, campaignName, industry, location],
    );
    const campaign = campaignResult.rows[0];

    const jobResult = await client.query(
      `INSERT INTO automation_jobs (campaign_id, job_type, status, input)
       VALUES ($1, 'scraping', 'queued', $2) RETURNING *`,
      [campaign.id, JSON.stringify({ industry, location, maxLeads })],
    );
    const job = jobResult.rows[0];

    await client.query("COMMIT");

    await triggerScraperWorkflow({
      jobId: job.id,
      campaignId: campaign.id,
      payload: { industry, location, maxLeads },
    });

    res.json({ success: true, campaign });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

exports.startJob = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE automation_jobs SET status = 'running' WHERE id = $1`,
      [id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.completeJob = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE automation_jobs SET status='completed', completed_at=NOW()
       WHERE id=$1 RETURNING campaign_id`,
      [id],
    );

    // Reconcile BEFORE responding — this call is server-to-server, nothing
    // user-facing is waiting on it, so it's safe (and necessary) to await.
    if (result.rows.length > 0) {
      await reconcileCampaignStatus(result.rows[0].campaign_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.failJob = async (req, res) => {
  const { id } = req.params;
  const { error } = req.body;

  try {
    const result = await pool.query(
      `UPDATE automation_jobs
       SET status = 'failed', completed_at = NOW(),
           input = input || jsonb_build_object('error', $2::text)
       WHERE id = $1
       RETURNING campaign_id`,
      [id, error || "Unknown scraping error"],
    );

    if (result.rows.length > 0) {
      await reconcileCampaignStatus(result.rows[0].campaign_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCampaigns = async (req, res) => {
  // unchanged from your version — no state-management issues here
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.industry, c.target_location AS "location",
        c.created_at AS "startedAt", c.status AS "campaignStatus",
        j.status AS "scrapingJobStatus", j.input->>'maxLeads' AS "maxLeads",
        (SELECT COUNT(*)::int FROM businesses b WHERE b.campaign_id = c.id) AS "leadsFound",
        (SELECT COUNT(*)::int FROM automation_jobs aj WHERE aj.campaign_id = c.id AND aj.status IN ('queued', 'running')) AS "activeJobsCount",
        (SELECT COUNT(*)::int FROM automation_jobs aj WHERE aj.campaign_id = c.id AND aj.status = 'failed') AS "failedJobsCount"
      FROM campaigns c
      LEFT JOIN automation_jobs j ON j.campaign_id = c.id AND j.job_type = 'scraping'
      ORDER BY c.created_at DESC
    `);

    const campaigns = result.rows.map((row) => {
      const date = new Date(row.startedAt);
      const formattedDate = date
        .toISOString()
        .replace("T", " ")
        .substring(0, 16);

      let status = "Completed";
      if (row.scrapingJobStatus === "failed") {
        status = "Failed";
      } else if (
        row.activeJobsCount > 0 ||
        row.campaignStatus === "searching" ||
        row.campaignStatus === "enriching" ||
        row.scrapingJobStatus === "running"
      ) {
        status = "Processing";
      } else if (row.scrapingJobStatus === "queued") {
        status = "Queued";
      }

      const filters = ["Has Website"];
      if (row.maxLeads) filters.push(`Max Leads: ${row.maxLeads}`);

      return {
        id: row.id,
        industry: row.industry,
        location: row.location,
        leadsFound: row.leadsFound || 0,
        status,
        startedAt: formattedDate,
        filters,
      };
    });

    res.json({ success: true, campaigns });
  } catch (err) {
    console.error("Fetch Campaigns Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
