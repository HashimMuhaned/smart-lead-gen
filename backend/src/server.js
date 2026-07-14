const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
require('dotenv').config();

const app = express();

// Update CORS to accept both your local dev and tunnel requests
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://rdd24wxm-3000.inc1.devtunnels.ms" // Your VS Code tunnel URL (No trailing slash)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Added PATCH here
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Wire up your structural routes
app.use("/api/campaigns", campaignRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
