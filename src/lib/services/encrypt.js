const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const DotenvKeys = require('./../helpers/dotenvKeys')
const DotenvVault = require('./../helpers/dotenvVault')

class Encrypt {
  constructor (directory = '.', envFile = '.env') {
    this.directory = directory
    this.envFile = envFile
    // calculated
    this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
  }

  run () {
    if (this.envFile.length < 1) {
      const code = 'MISSING_ENV_FILES'
      const message = 'no .env* files found'
      const help = `? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]`

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const dotenvKeys = this._parsedDotenvKeys()
    const envFilepaths = this._envFilepaths()

    // build filepaths to be passed to DotenvKeys
    const uniqueEnvFilepaths = new Set()
    for (const envFilepath of envFilepaths) {
      const filepath = path.resolve(this.directory, envFilepath)
      if (!fs.existsSync(filepath)) {
        const code = 'MISSING_ENV_FILE'
        const message = `file does not exist at [${filepath}]`
        const help = `? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx encrypt]`

        const error = new Error(message)
        error.code = code
        error.help = help
        throw error
      }

      uniqueEnvFilepaths.add(filepath)
    }

    // generate .env.keys string
    const {
      envKeys,
      addedKeys,
      existingKeys
    } = new DotenvKeys([...uniqueEnvFilepaths], dotenvKeys).run()

    // const { envVault, addedVaults, existingVaults, addedEnvFilepaths, dotenvKeys } = new DotenvVault(this.directory, this.envFile).run()

    return {
      // from DotenvKeys
      envKeys: envKeys,
      addedKeys: addedKeys,
      existingKeys: existingKeys,
      // from DotenvVault
      // envVault: envVault,
      // addedVaults: addedVaults,
      // existingVaults: existingVaults,
      // addedEnvFilepaths: addedEnvFilepaths,
      // dotenvKeys: dotenvKeys
    }
  }

  envVault () {
    return '<env vault file>'
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }

  _parsedDotenvKeys () {
    const options = {
      path: this.envKeysFilepath
    }

    return dotenv.configDotenv(options).parsed || {}
  }
}

module.exports = Encrypt
