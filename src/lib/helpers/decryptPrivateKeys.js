const { symDecrypt } = require('eciesjs/utils')

const Errors = require('./errors')
const { getKeyFromPasswordAndSalt } = require('./getKeyFromPasswordAndSalt')
const { bytesToBase64 } = require('./bytesToBase64')
const { base64ToBytes } = require('./base64ToBytes')

const PREFIX = 'encrypted:'

/**
 * Decrypt private keys using symmetric (password) encryption
 * @param {string} privateKeyName - Name of the private key to decrypt
 * @param {string} privateKey - Private key to decrypt
 * @param {string} passPhrase - Passphrase to use for decryption
 * @param {string} salt - Salt to use for decryption
 * @throws {Errors.missingPrivateKey} - If the private key is missing
 * @throws {Errors.invalidPassPhrase} - If the passphrase is invalid
 * @returns {string} - Decrypted private key
 */
function decryptPrivateKeys (privateKeyName, privateKey, passPhrase, salt) {
  let decryptedPrivateKey
  let decryptionError

  privateKey = privateKey || ''
  if (!privateKey.startsWith(PREFIX)) {
    return privateKey
  }

  if (privateKey.length <= 0) {
    decryptionError = new Errors({
      privateKeyName,
      privateKey
    }).missingPrivateKeyForLock()
  } else {
    const privateKeys = privateKey.split(',')
    for (const privKey of privateKeys) {
      decryptedPrivateKey = privKey
      try {
        const key = getKeyFromPasswordAndSalt(passPhrase, salt)
        const encryptedPrivateKeyUint8Array = base64ToBytes(
          privKey.normalize().replace(PREFIX, '')
        )
        const decryptedPrivateKeyUint8Array = symDecrypt(
          key,
          encryptedPrivateKeyUint8Array
        )

        const decryptedPrivateKeyBase64 = bytesToBase64(
          decryptedPrivateKeyUint8Array
        )
        decryptedPrivateKey = atob(decryptedPrivateKeyBase64)
        decryptionError = null // reset to null error (scenario for multiple private keys)
        break
      } catch (e) {
        if (
          e.message === 'Invalid private key' ||
          e.message === 'Unsupported state or unable to authenticate data'
        ) {
          decryptionError = new Errors({
            privateKeyName,
            privateKey
          }).invalidPassPhrase()
        }
      }
    }
  }

  if (decryptionError) {
    throw decryptionError
  }

  return decryptedPrivateKey
}

module.exports = decryptPrivateKeys
