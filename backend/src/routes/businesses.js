const express = require("express");
const router = express.Router();
const {
  insertBusinesses,
  getBusinessById,
  getBusinesses,         
  saveAnalysisResults,
  getBusinessProfile,
  getBusinessDetails,         
} = require("../controllers/businessController");

// List all businesses in frontend interface format
router.get("/", getBusinesses);
router.get("/:id/details", getBusinessDetails);

// Detail views & callbacks
router.get("/:id/profile", getBusinessProfile);
router.get("/:id", getBusinessById);
router.post("/bulk", insertBusinesses);
router.post("/analysis-results", saveAnalysisResults);

module.exports = router;