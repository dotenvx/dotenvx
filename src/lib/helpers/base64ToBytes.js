/**
 * Convert a base64-encoded string to an array of bytes.
 * @param {string} base64 - the base64-encoded string to convert
 * @returns {Uint8Array} - the converted array of bytes
 */
function base64ToBytes (base64) {
  const binString = atob(base64)
  return Uint8Array.from(binString, (m) => m.codePointAt(0))
}

module.exports = { base64ToBytes }
