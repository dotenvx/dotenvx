const { spawnSync } = require('child_process')
const gpgAvailable = require('./gpgAvailable')

const GPG_PREFIX = 'gpg:encrypted:'

/**
 * Decrypt a GPG-encrypted value
 * For YubiKey: will trigger PIN prompt via gpg-agent
 * @param {string} key - The environment variable key (for error messages)
 * @param {string} value - The encrypted value with gpg:encrypted: prefix
 * @returns {string} Decrypted plaintext value
 */
function gpgDecryptValue (key, value) {
  if (!value.startsWith(GPG_PREFIX)) {
    return value
  }

  // Check GPG availability
  const gpg = gpgAvailable()
  if (!gpg.available) {
    const error = new Error(`[GPG_NOT_AVAILABLE] ${gpg.error}`)
    error.code = 'GPG_NOT_AVAILABLE'
    error.help = '[GPG_NOT_AVAILABLE] Install GnuPG: https://gnupg.org/download/'
    throw error
  }

  const base64 = value.substring(GPG_PREFIX.length)
  const armoredCiphertext = wrapInArmor(base64)

  try {
    // gpg-agent handles PIN prompts for YubiKey
    // --quiet: suppress extra output
    // Note: NOT using --batch to allow PIN prompts
    const result = spawnSync(gpg.bin, ['--decrypt', '--quiet'], {
      input: armoredCiphertext,
      encoding: 'utf8',
      timeout: 60000, // 60s timeout for YubiKey PIN entry
      stdio: ['pipe', 'pipe', 'pipe']
    })

    if (result.status !== 0) {
      const stderr = result.stderr || ''

      // Check for common YubiKey errors
      if (stderr.includes('card error') || stderr.includes('No secret key')) {
        const error = new Error(`[YUBIKEY_NOT_PRESENT] YubiKey required for decryption of '${key}'`)
        error.code = 'YUBIKEY_NOT_PRESENT'
        error.help = '[YUBIKEY_NOT_PRESENT] Insert your YubiKey and try again'
        throw error
      }

      if (stderr.includes('Bad PIN') || stderr.includes('PIN blocked')) {
        const error = new Error(`[GPG_BAD_PIN] Incorrect PIN for decryption of '${key}'`)
        error.code = 'GPG_BAD_PIN'
        error.help = '[GPG_BAD_PIN] Enter correct PIN. After 3 failed attempts, YubiKey may be locked.'
        throw error
      }

      throw new Error(stderr || 'Decryption failed')
    }

    return result.stdout
  } catch (e) {
    // Re-throw known errors
    if (e.code === 'GPG_NOT_AVAILABLE' || e.code === 'YUBIKEY_NOT_PRESENT' || e.code === 'GPG_BAD_PIN') {
      throw e
    }

    const error = new Error(`[GPG_DECRYPTION_FAILED] Unable to decrypt '${key}': ${e.message}`)
    error.code = 'GPG_DECRYPTION_FAILED'
    error.help = [
      '[GPG_DECRYPTION_FAILED] Possible causes:',
      '  1. YubiKey not inserted',
      '  2. Wrong PIN entered',
      '  3. GPG key not available',
      `  Debug: ${gpg.bin} --decrypt --verbose`
    ].join('\n')
    throw error
  }
}

/**
 * Wrap base64 content in PGP ASCII armor
 * @param {string} base64 - Base64 encoded content
 * @returns {string} Full ASCII armored PGP message
 */
function wrapInArmor (base64) {
  // Split into 64-character lines (PGP standard)
  const lines = base64.match(/.{1,64}/g) || [base64]
  return [
    '-----BEGIN PGP MESSAGE-----',
    '',
    ...lines,
    '-----END PGP MESSAGE-----'
  ].join('\n')
}

module.exports = gpgDecryptValue
module.exports.GPG_PREFIX = GPG_PREFIX
module.exports.wrapInArmor = wrapInArmor
