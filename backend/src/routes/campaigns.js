const express = require("express");
const router = express.Router();
const { createCampaign, startJob, completeJob } = require("../controllers/campaignController");

router.post("/", createCampaign);

router.patch("/jobs/:id/start", startJob);
router.patch("/jobs/:id/complete", completeJob);


module.exports = router;
