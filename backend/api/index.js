const express = require("express");
const cors = require("cors"); // Import the cors package
const campaignRoutes = require("../src/routes/campaigns");
const businessRoutes = require("../src/routes/businesses");
const contactRoutes = require("../src/routes/contacts");
const emailRoutes = require("../src/routes/email");
require("dotenv").config();

const app = express();

app.use(express.json());

// 1. Define your allowed origins list
const allowedOrigins = [
  "https://smart-lead-gen-frontend.vercel.app",
  "https://scrape-service.n8nselfhostedautomations.tech",
  "http://localhost:5173",
];

// 2. Configure CORS middleware dynamically
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders:
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  }),
);

// Express 5 safe catch-all for preflight options
app.options(/.*/, cors());

app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/emails", emailRoutes);
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

module.exports = app;
