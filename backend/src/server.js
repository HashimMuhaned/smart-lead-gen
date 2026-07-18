const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
const businessRoutes = require("./routes/businesses");
require('dotenv').config();

const app = express();

// Use a cleaner fallback config for local execution, Vercel will override this using vercel.json in prod
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "https://smart-lead-gen-858q.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173"
        ];
        // Allow server-to-server requests (like your scraper hitting the backend directly with no origin header)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// Explicitly catch and instantly return 200 OK for any baseline preflight OPTIONS requests
app.options("*", cors());

// Wire up structural routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;