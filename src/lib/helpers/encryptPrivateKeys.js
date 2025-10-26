const { symEncrypt } = require('eciesjs/utils');

const Errors = require('./errors');
const { getKeyFromPasswordAndSalt } = require('./getKeyFromPasswordAndSalt');
const { bytesToBase64 } = require('./bytesToBase64');

const PREFIX = 'encrypted:'

/**
 * Encrypts private keys using symmetric (password) encryption
 * @param {string} privateKeyName - Name of the private key to encrypt
 * @param {string} privateKey - Private key to encrypt
 * @param {string} passPhrase - Passphrase to use for encryption
 * @param {string} salt - Salt to use for encryption
 * @throws {Errors.missingPrivateKey} - If the private key is missing
 * @throws {Errors.invalidPassPhrase} - If the passphrase is invalid
 * @returns {string} - Encrypted private key
 */
function encryptPrivateKeys (privateKeyName, privateKey, passPhrase , salt) {
  let encryptedPrivateKey
  let encryptionError

  privateKey = privateKey || ''
  if (privateKey.startsWith(PREFIX)) {
    return privateKey
  }

  if (privateKey.length <= 0) {
    encryptionError = new Errors({ privateKeyName, privateKey }).missingPrivateKeyForLock()
  } else {
    const privateKeys = privateKey.split(',')
    for (const privKey of privateKeys) {
      encryptedPrivateKey = privKey;
      try {
        const key =  getKeyFromPasswordAndSalt(passPhrase, salt);
        const encryptedPrivateKeyUint8Array =
          symEncrypt(
            key,
            privKey.normalize()
          );
        const encryptedPrivateKeyHex = bytesToBase64(encryptedPrivateKeyUint8Array);
        
        encryptedPrivateKey = `${PREFIX}${encryptedPrivateKeyHex}`;
        encryptionError = null // reset to null error (scenario for multiple private keys)
        break
      } catch (e) {
        if (e.message === 'Invalid private key' || e.message === 'Unsupported state or unable to authenticate data') {
          encryptionError = new Errors({ privateKeyName, privateKey }).invalidPassPhrase()
        } 
      }

    }
  }

  if (encryptionError) {
    throw encryptionError
  }

  return encryptedPrivateKey
}

module.exports = encryptPrivateKeys
