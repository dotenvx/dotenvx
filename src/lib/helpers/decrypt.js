const dotenv = require('dotenv')

const parseEncryptionKeyFromDotenvKey = require('./parseEncryptionKeyFromDotenvKey')

function decrypt (ciphertext, dotenvKey) {
  const key = parseEncryptionKeyFromDotenvKey(dotenvKey)

  try {
    return dotenv.decrypt(ciphertext, key)
  } catch (e) {
    const error = new Error('[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
    error.code = 'DECRYPTION_FAILED'
    error.help = '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.'
    error.debug = `[DECRYPTION_FAILED] DOTENV_KEY is ${dotenvKey}`

    switch (e.code) {
      case 'DECRYPTION_FAILED':
        throw error
      default:
        throw e
    }
  }
}

module.exports = decrypt
