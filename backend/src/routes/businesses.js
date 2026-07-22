const express = require("express");
const router = express.Router();
const {
  insertBusinesses,
  getBusinessById,
  getBusinessProfile,
  saveAnalysisResults,
} = require("../controllers/businessController");

router.post("/bulk", insertBusinesses);
router.post("/analysis-results", saveAnalysisResults); // Callback from scraper
router.get("/:id/profile", getBusinessProfile);        // Full profile for React UI
router.get("/:id", getBusinessById);

module.exports = router;