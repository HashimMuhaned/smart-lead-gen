const express = require("express");
const campaignRoutes = require("./src/routes/campaigns");
const businessRoutes = require("./src/routes/businesses");
require('dotenv').config();

const app = express();

app.use(express.json());

// --- ADD THIS TRICK FOR VERCEL PREFLIGHTS ---
// Intercept all OPTIONS requests and respond instantly with 200 OK
app.options("/*", (req, res) => {
    res.sendStatus(200);
});
// --------------------------------------------

// Wire up your actual routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

module.exports = app;