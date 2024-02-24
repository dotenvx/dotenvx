const fs = require('fs')
const path = require('path')

class RunVault {
  constructor(envVaultFile = '.env.vault') {
    this.envVaultFile = envVaultFile
  }

  run () {
    const filepath = path.resolve(this.envVaultFile)
    if (!fs.existsSync(filepath)) {
      const code = 'MISSING_ENV_VAULT_FILE'
      const message = `you set DOTENV_KEY but your .env.vault file is missing: ${filepath}`
      const error = new Error(message)
      error.code = code
      throw error
    }
  }
}

module.exports = RunVault
