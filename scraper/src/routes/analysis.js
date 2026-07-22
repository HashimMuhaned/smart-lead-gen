const express = require("express");
const router = express.Router();
const { analyzeBusiness } = require("../controllers/analysisController");

router.post("/", analyzeBusiness);

module.exports = router;