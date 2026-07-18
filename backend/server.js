const express = require("express");
const cors = require("cors"); // 1. Import cors
const campaignRoutes = require("./src/routes/campaigns");
const businessRoutes = require("./src/routes/businesses");
require('dotenv').config();

const app = express();

// 2. Configure CORS options
const corsOptions = {
    origin: "https://smart-lead-gen-frontend.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // Allow cookies/auth headers if needed
};

app.use(cors(corsOptions)); // 3. Use it before your routes
app.use(express.json());

// Wire up routes directly
app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

module.exports = app;