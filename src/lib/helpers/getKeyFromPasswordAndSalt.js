// const { deriveKey } = require('eciesjs/utils');

const hkdf = require("@noble/hashes/hkdf");
const sha256 = require("@noble/hashes/sha256");

/**
 * Derive a 32-byte key from a password and salt using HKDF-SHA256.
 * 
 * NB: this is copied from the deriveKey function from eciesjs/utils/hash.js ,
 * modified to accept both password and salt as inputs.
 * 
 * @link https://github.com/ecies/js/blob/master/src/utils/hash.ts
 *
 * @param {string} password - the password to convert
 * @param {string} salt - the salt to use for the conversion
 * @returns {Uint8Array} - the derived key
 */
function deriveKey  (password, salt) {
    // 32 bytes shared secret for aes256 and xchacha20 derived from HKDF-SHA256
    return hkdf.hkdf(sha256.sha256, password, salt, undefined, 32);
};


/**
 * Convert a password into a 32-byte key using eciejs.
 * @param {string} password - the password to convert
 * @param {string} salt - the salt to use for the conversion
 * @returns {Uint8Array} - the converted key
 */
function getKeyFromPasswordAndSalt(password, salt) {
  // Convert password into 32-byte key using scrypt
  // sync, but scryptAsync is also available
  const key = deriveKey(password.normalize(), salt.normalize());
  return key;
}

module.exports = { getKeyFromPasswordAndSalt };