const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("../src/routes/campaigns");
const businessRoutes = require("../src/routes/businesses");
require('dotenv').config();

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Define allowed origins explicitly
const allowedOrigins = [
    "https://smart-lead-gen-858q.vercel.app", 
    "http://localhost:3000", 
    "http://localhost:5173"
];

// Let the cors middleware handle everything natively (headers, methods, preflight)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["X-CSRF-Token", "X-Requested-With", "Accept", "Accept-Version", "Content-Length", "Content-MD5", "Content-Type", "Date", "X-Api-Version", "Authorization"]
}));

app.use(express.json());

// Wire up your structural routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

// Only needed for local development testing (Vercel ignores this in production)
if (!isProd) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;