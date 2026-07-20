const express = require("express");
const router = express.Router();
const { enrichContact } = require("../controllers/enrichmentController");

router.post("/", enrichContact);

module.exports = router;