const express = require("express");
const router = express.Router();

const { updateEmail, regenerateEmail } = require("../controllers/emailController");

router.put("/update/:id", updateEmail);
router.post("/regenerate/:id", regenerateEmail);

module.exports = router;