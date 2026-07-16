const { scrape } = require("../services/googleMapScraper");

exports.scrapeGoogleMaps = async (req, res) => {
  try {
    const { industry, location, limit } = req.body;

    const businesses = await scrape({
      industry,
      location,
      limit,
    });

    res.json({
      success: true,

      count: businesses.length,

      businesses,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
