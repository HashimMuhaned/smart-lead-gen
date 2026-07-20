const express = require("express");
const router = express.Router();
const { insertContactsBulk } = require("../controllers/contactController");

router.post("/bulk", insertContactsBulk);

module.exports = router;