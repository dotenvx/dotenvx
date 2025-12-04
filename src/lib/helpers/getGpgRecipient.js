/**
 * Get GPG recipient (key ID, fingerprint, or email) from options or environment
 * Priority: 1. --gpg-key flag, 2. DOTENV_GPG_KEY_<ENV> env, 3. DOTENV_GPG_KEY env
 * @param {object} options - Options object
 * @param {string} [options.gpgKey] - GPG key from --gpg-key flag
 * @param {string} [envFilepath] - Path to env file for environment-specific key lookup
 * @returns {string|null}
 */
function getGpgRecipient (options = {}, envFilepath = null) {
  // Check --gpg-key flag
  if (options.gpgKey) {
    return options.gpgKey
  }

  // Check environment variables
  // Support environment-specific keys: DOTENV_GPG_KEY_PRODUCTION, etc.
  if (envFilepath) {
    const envSuffix = getEnvSuffix(envFilepath)
    if (envSuffix) {
      const envSpecificKey = process.env[`DOTENV_GPG_KEY_${envSuffix.toUpperCase()}`]
      if (envSpecificKey) {
        return envSpecificKey
      }
    }
  }

  // Fallback to generic key
  return process.env.DOTENV_GPG_KEY || null
}

/**
 * Extract environment suffix from filepath
 * @param {string} envFilepath - Path like .env.production
 * @returns {string|null}
 */
function getEnvSuffix (envFilepath) {
  // Extract environment from filepath like .env.production → production
  const match = envFilepath.match(/\.env\.(.+)$/)
  return match ? match[1] : null
}

module.exports = getGpgRecipient
