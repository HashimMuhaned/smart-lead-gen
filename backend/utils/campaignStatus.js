const pool = require("../db");

/**
 * Re-evaluates a campaign's overall status from the real state of its jobs.
 * Never throws — this is best-effort bookkeeping and must never be the
 * reason a request fails or a caller's transaction gets mishandled.
 */
async function reconcileCampaignStatus(campaignId) {
  if (!campaignId) return;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('queued','running'))::int AS active,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*)::int AS total
      FROM automation_jobs
      WHERE campaign_id = $1
      `,
      [campaignId],
    );

    const { active, failed, completed, total } = rows[0];

    // Work still in flight for this campaign — do nothing.
    if (active > 0) return;

    // "failed" only when EVERYTHING failed; a mix of completed + failed
    // still counts as completed (partial success), so the UI shows the
    // leads that did make it through instead of hiding everything.
    let finalStatus = "completed";
    if (total > 0 && completed === 0 && failed > 0) {
      finalStatus = "failed";
    }

    await pool.query(
      `UPDATE campaigns SET status = $2, updated_at = NOW() WHERE id = $1`,
      [campaignId, finalStatus],
    );
  } catch (err) {
    console.error(`[reconcileCampaignStatus] Failed for campaign ${campaignId}:`, err.message);
  }
}

module.exports = { reconcileCampaignStatus };