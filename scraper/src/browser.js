// browser.js
const { chromium } = require("playwright");

async function launchBrowser() {
  // Use headless mode in production (on your server), but keep GUI for local testing
  const isProd = process.env.NODE_ENV === "production";

  const browser = await chromium.launch({
    headless: true, 
  });

  return browser;
}

module.exports = {
  launchBrowser,
};