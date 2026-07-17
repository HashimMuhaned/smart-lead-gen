// backend/src/routes/campaigns.js
const express = require("express");
const router = express.Router();
const { 
  createCampaign, 
  startJob, 
  completeJob, 
  failJob,
  getCampaigns // Import the new controller function
} = require("../controllers/campaignController");

// Retrieve all campaigns
router.get("/", getCampaigns);

// Lifecycle routes
router.post("/", createCampaign);
router.patch("/jobs/:id/start", startJob);
router.patch("/jobs/:id/complete", completeJob);
router.patch("/jobs/:id/fail", failJob);

module.exports = router;