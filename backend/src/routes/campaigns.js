const express = require("express");
const router = express.Router();
const { createCampaign, startJob } = require("../controllers/campaignController");

router.post("/", createCampaign);

router.patch("/jobs/:id/start", startJob);


module.exports = router;
