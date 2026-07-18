const express = require("express");
const cors = require("cors"); 
// Fixed relative paths because this file moved into backend/api/
const campaignRoutes = require("../src/routes/campaigns");
const businessRoutes = require("../src/routes/businesses");
require('dotenv').config();

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Handle preflight options requests globally at the code layer for bulletproof backup
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "https://smart-lead-gen-858q.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Extra local development support fallback
if (!isProd) {
    app.use(cors({
        origin: ["https://smart-lead-gen-858q.vercel.app", "http://localhost:3000", "http://localhost:5173"],
        credentials: true
    }));
}

app.use(express.json());

// Wire up your structural routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (!isProd) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;