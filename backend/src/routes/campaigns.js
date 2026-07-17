const express = require("express");
const router = express.Router();
const { createCampaign, startJob, completeJob, failJob } = require("../controllers/campaignController");

router.post("/", createCampaign);

router.patch("/jobs/:id/start", startJob);
router.patch("/jobs/:id/complete", completeJob);
router.patch("/jobs/:id/fail", failJob); // Hooked up the failure handler route

module.exports = router;