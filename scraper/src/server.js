require("dotenv").config();

const express = require("express");
const cors = require("cors");

const googleMapsRoutes = require("./routes/googleMaps");

const app = express();

app.use(cors());

app.use(express.json());

// routes
app.use("/google-maps", googleMapsRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
});
