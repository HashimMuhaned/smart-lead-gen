const express = require("express");
// Added an extra dot (..) to go up out of the api folder into src
const campaignRoutes = require("../src/routes/campaigns");
const businessRoutes = require("../src/routes/businesses");
require("dotenv").config();

const app = express();

app.use(express.json());

// You can safely keep or remove the app.options wrapper here
// since vercel.json will be handling it cleanly now.
// Replace your old app.options("/*", ...) with this:
app.options(/.*/, (req, res) => {
  res.sendStatus(200);
});

app.use("/api/campaigns", campaignRoutes);
app.use("/api/businesses", businessRoutes);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

module.exports = app;
