/**
 * Splits a standard Google Maps comma-separated address into its components.
 * @param {string|null} address 
 * @returns {{ city: string|null, country: string|null }}
 */
function parseAddress(address) {
  let city = null;
  let country = null;

  if (address) {
    const addressParts = address.split(",").map((p) => p.trim());
    if (addressParts.length >= 2) {
      country = addressParts[addressParts.length - 1];
      city = addressParts[addressParts.length - 2];
    }
  }

  return { city, country };
}

/**
 * Cleans text by stripping emojis, weird unicode icons, control characters,
 * and collapsing multiple spaces while preserving English & Arabic characters.
 */
function cleanText(text) {
  if (!text) return null;

  return text
    .replace(/[^\x20-\x7E\u0600-\u06FF]/g, "") // remove icons/control chars, keep standard ASCII and Arabic
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { parseAddress, cleanText };