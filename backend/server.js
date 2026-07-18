const express = require("express");
const campaignRoutes = require("../frontend/src/routes/campaigns");
const businessRoutes = require("../frontend/src/routes/businesses");
require('dotenv').config();

const app = express();
app.use(express.json());

// Wire up routes directly
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

module.exports = app;