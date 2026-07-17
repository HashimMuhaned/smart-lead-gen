const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
const businessRoutes = require("./routes/businesses");
require('dotenv').config();

const app = express();

// Update CORS to explicitly accept your environments
app.use(cors({
    origin: [
        "https://smart-lead-gen-858q.vercel.app", // Your specific Vercel production frontend
        "http://localhost:3000",                  // Your local development port (change if using 5173, etc.)
        "http://localhost:5173"                   // Vite default port, just in case
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true                             // Required if sending tokens/cookies
}));

app.use(express.json());

// Wire up your structural routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;
