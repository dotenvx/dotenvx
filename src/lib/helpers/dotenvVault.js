const path = require('path')

const encrypt = require('./encrypt')
const changed = require('./changed')
const guessEnvironment = require('./guessEnvironment')
const removePersonal = require('./removePersonal')

class DotenvVault {
  constructor (dotenvFiles = {}, dotenvKeys = {}, dotenvVaults = {}) {
    this.dotenvFiles = dotenvFiles // key: filepath and value: filecontent
    this.dotenvKeys = dotenvKeys // pass current parsed dotenv keys from .env.keys
    this.dotenvVaults = dotenvVaults // pass current parsed dotenv vaults from .env.vault
  }

  run () {
    const addedVaults = new Set()
    const existingVaults = new Set()
    const addedDotenvFilenames = new Set()

    for (const [filepath, raw] of Object.entries(this.dotenvFiles)) {
      const environment = guessEnvironment(filepath)
      const vault = `DOTENV_VAULT_${environment.toUpperCase()}`

      let ciphertext = this.dotenvVaults[vault]
      const dotenvKey = this.dotenvKeys[`DOTENV_KEY_${environment.toUpperCase()}`]

      const cleanRaw = removePersonal(raw)

      if (!ciphertext || ciphertext.length === 0 || changed(ciphertext, cleanRaw, dotenvKey)) {
        ciphertext = encrypt(cleanRaw, dotenvKey)
        this.dotenvVaults[vault] = ciphertext
        addedVaults.add(vault) // for info logging to user

        addedDotenvFilenames.add(path.basename(filepath)) // for info logging to user
      } else {
        existingVaults.add(vault) // for info logging to user
      }
    }

    let vaultData = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/\n\n`

    for (const [vault, value] of Object.entries(this.dotenvVaults)) {
      const environment = vault.replace('DOTENV_VAULT_', '').toLowerCase()
      vaultData += `# ${environment}\n`
      vaultData += `${vault}="${value}"\n\n`
    }

    return {
      dotenvVaultFile: vaultData,
      addedVaults: [...addedVaults], // return set as array
      existingVaults: [...existingVaults], // return set as array
      addedDotenvFilenames: [...addedDotenvFilenames] // return set as array
    }
  }
}

module.exports = DotenvVault
