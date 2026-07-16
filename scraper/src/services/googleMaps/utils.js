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

module.exports = { parseAddress };