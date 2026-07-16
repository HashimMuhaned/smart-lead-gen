const express = require("express");
const cors = require("cors"); 
const campaignRoutes = require("./routes/campaigns");
const businessRoutes = require("./routes/businesses");
require('dotenv').config();

const app = express();

// Update CORS to accept your frontend environments
app.use(cors({
    origin: [
        "*"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
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
