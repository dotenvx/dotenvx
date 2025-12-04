const { execSync } = require('child_process')

/**
 * Check if gpg CLI is available
 * @returns {{ available: boolean, version: string|null, error: string|null, bin: string|null }}
 */
function gpgAvailable () {
  // Try gpg first, then gpg2 (common on some Linux distros)
  const binaries = ['gpg', 'gpg2']

  for (const bin of binaries) {
    try {
      const version = execSync(`${bin} --version`, {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      const match = version.match(/gpg \(GnuPG\) (\d+\.\d+(?:\.\d+)?)/)
      return {
        available: true,
        version: match ? match[1] : 'unknown',
        error: null,
        bin
      }
    } catch (_e) {
      // Try next binary
    }
  }

  return {
    available: false,
    version: null,
    error: 'gpg not found. Install GnuPG: https://gnupg.org/download/',
    bin: null
  }
}

module.exports = gpgAvailable
