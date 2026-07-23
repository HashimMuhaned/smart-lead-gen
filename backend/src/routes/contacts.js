const express = require("express");
const router = express.Router();
const { insertContactsBulk, handleEnrichmentFailure } = require("../controllers/contactController");

router.post("/bulk", insertContactsBulk);
// backend/routes/contactRoutes.js
router.post("/enrichment-failed", handleEnrichmentFailure);

module.exports = router;