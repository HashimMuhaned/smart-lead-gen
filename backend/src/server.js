const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
require('dotenv').config();

const app = express();

// Update CORS to accept your frontend environments
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://rdd24wxm-3000.inc1.devtunnels.ms", // Your old local dev tunnel
        /\.vercel\.app$/ // ✅ This allows ALL Vercel preview/production links to hit your API safely
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Wire up your structural routes
app.use("/api/campaigns", campaignRoutes);

// ✅ Crucial change for local testing vs. Serverless production environment
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

// ✅ Crucial change: Export app instance so Vercel can handle routing
module.exports = app;
