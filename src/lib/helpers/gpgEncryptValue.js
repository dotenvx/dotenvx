const { spawnSync } = require('child_process')
const gpgAvailable = require('./gpgAvailable')

const GPG_PREFIX = 'gpg:encrypted:'

/**
 * Encrypt a value using GPG
 * @param {string} value - The value to encrypt
 * @param {string} recipient - GPG key ID, fingerprint, or email
 * @returns {string} Encrypted value with gpg:encrypted: prefix
 */
function gpgEncryptValue (value, recipient) {
  // Validate recipient
  if (!recipient) {
    const error = new Error('[MISSING_GPG_RECIPIENT] GPG recipient (key ID or email) is required')
    error.code = 'MISSING_GPG_RECIPIENT'
    error.help = '[MISSING_GPG_RECIPIENT] Set DOTENV_GPG_KEY environment variable or use --gpg-key flag'
    throw error
  }

  // Check GPG availability
  const gpg = gpgAvailable()
  if (!gpg.available) {
    const error = new Error(`[GPG_NOT_AVAILABLE] ${gpg.error}`)
    error.code = 'GPG_NOT_AVAILABLE'
    error.help = '[GPG_NOT_AVAILABLE] Install GnuPG: https://gnupg.org/download/'
    throw error
  }

  try {
    // --armor: ASCII output
    // --trust-model always: skip trust db check (useful for CI)
    // --batch: non-interactive
    // --yes: overwrite without prompt
    const result = spawnSync(gpg.bin, [
      '--encrypt',
      '--armor',
      '--recipient', recipient,
      '--trust-model', 'always',
      '--batch',
      '--yes'
    ], {
      input: value,
      encoding: 'utf8',
      timeout: 30000, // 30s timeout
      stdio: ['pipe', 'pipe', 'pipe']
    })

    if (result.status !== 0) {
      const stderr = result.stderr || ''
      throw new Error(stderr || 'GPG encryption failed')
    }

    // Extract base64 from ASCII armor
    const base64 = extractBase64FromArmor(result.stdout)
    return `${GPG_PREFIX}${base64}`
  } catch (e) {
    if (e.code === 'MISSING_GPG_RECIPIENT' || e.code === 'GPG_NOT_AVAILABLE') {
      throw e
    }

    const error = new Error(`[GPG_ENCRYPTION_FAILED] GPG encryption failed: ${e.message}`)
    error.code = 'GPG_ENCRYPTION_FAILED'
    error.help = `[GPG_ENCRYPTION_FAILED] Verify GPG key exists: ${gpg.bin} --list-keys ${recipient}`
    throw error
  }
}

/**
 * Extract base64 content from PGP ASCII armor
 * @param {string} armoredText - Full ASCII armored PGP message
 * @returns {string} Base64 encoded content without headers/footers
 */
function extractBase64FromArmor (armoredText) {
  const lines = armoredText.split('\n')
  const dataLines = lines.filter(line =>
    !line.startsWith('-----') &&
    !line.startsWith('Version:') &&
    !line.startsWith('Comment:') &&
    !line.startsWith('Hash:') &&
    line.trim() !== ''
  )
  return dataLines.join('')
}

module.exports = gpgEncryptValue
module.exports.GPG_PREFIX = GPG_PREFIX
module.exports.extractBase64FromArmor = extractBase64FromArmor
