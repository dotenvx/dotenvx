
/**
 * Convert an array of bytes to a base64-encoded string.
 * @param {Uint8Array} bytes - the bytes to convert
 * @returns {string} - the base64-encoded string
 */
function bytesToBase64(bytes) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

module.exports = { bytesToBase64 };