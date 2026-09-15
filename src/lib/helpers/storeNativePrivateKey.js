const nativeProvider = require('../providers/native')
const armoredKeyDisplay = require('./armoredKeyDisplay')
const { logger } = require('../../shared/logger')

function storeNativePrivateKey (publicKey, privateKey, keysFilepath) {
  try {
    nativeProvider.set(publicKey, privateKey, `dotenvx (${armoredKeyDisplay(publicKey)})`)
  } catch (error) {
    if (error.code !== 'NATIVE_UNAVAILABLE') throw error
    logger.warn(`OS secret store unavailable; saving private key to ${keysFilepath}`)
    return false
  }

  // A successful write must be readable before committing the encrypted file.
  // Read failures must never fall back to plaintext storage.
  if (nativeProvider.get(publicKey) !== privateKey) {
    const error = new Error('could not verify private key in OS secret store')
    error.code = 'NATIVE_VERIFY_FAILED'
    throw error
  }
  return true
}

module.exports = storeNativePrivateKey
