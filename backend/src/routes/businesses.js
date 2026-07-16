const express = require("express");
const router = express.Router();

const { insertBusinesses } = require("../controllers/businessController");

router.post("/bulk", insertBusinesses);

module.exports = router;