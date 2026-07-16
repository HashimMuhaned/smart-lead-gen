const express = require("express");

const router = express.Router();

const { scrapeGoogleMaps } = require("../controllers/googleMapsController");

router.post("/", scrapeGoogleMaps);

module.exports = router;
