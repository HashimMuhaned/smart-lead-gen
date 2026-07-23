const express = require("express");
const router = express.Router();

const { updateEmail } = require("../controllers/emailController");

router.put("/update/:id", updateEmail);

module.exports = router;