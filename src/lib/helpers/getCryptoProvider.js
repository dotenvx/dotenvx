/**
 * Determine which crypto provider to use
 * Priority: 1. --gpg flag (options.gpg), 2. DOTENVX_CRYPTO env, 3. default 'ecies'
 * @param {object} options - Options object
 * @param {boolean} [options.gpg] - Whether --gpg flag was set
 * @returns {'ecies' | 'gpg'}
 */
function getCryptoProvider (options = {}) {
  // Explicit --gpg flag takes highest priority
  if (options.gpg === true) {
    return 'gpg'
  }

  // Check environment variable
  const envCrypto = process.env.DOTENVX_CRYPTO
  if (envCrypto === 'gpg') {
    return 'gpg'
  }

  // Default to ECIES
  return 'ecies'
}

module.exports = getCryptoProvider
