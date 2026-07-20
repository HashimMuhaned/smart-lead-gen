const express = require("express");
const router = express.Router();
const {
  insertBusinesses,
  getBusinessById,
} = require("../controllers/businessController");

router.post("/bulk", insertBusinesses);
router.get("/:id", getBusinessById);

module.exports = router;
