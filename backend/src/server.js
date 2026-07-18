const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
const businessRoutes = require("./routes/businesses");
require('dotenv').config();

const app = express();

const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
    // ONLY apply the cors package middleware locally to prevent clashing with vercel.json headers in production
    app.use(cors({
        origin: [
            "https://smart-lead-gen-858q.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));
} else {
    // In production, explicitly handle browser preflight OPTIONS requests cleanly before routing paths execute
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });
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