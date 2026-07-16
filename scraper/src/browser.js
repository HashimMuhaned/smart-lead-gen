// browser.js
const { chromium } = require("playwright");

async function launchBrowser() {
  // Use headless mode in production (on your server), but keep GUI for local testing
  const isProd = process.env.NODE_ENV === "production";

  const browser = await chromium.launch({
    headless: isProd ? true : false, 
  });

  return browser;
}

module.exports = {
  launchBrowser,
};