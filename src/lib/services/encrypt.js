const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const DotenvKeys = require('./../helpers/dotenvKeys')
const DotenvVault = require('./../helpers/dotenvVault')

const ENCODING = 'utf8'

const findEnvFiles = require('../helpers/findEnvFiles')

class Encrypt {
  constructor (directory = '.', envFile) {
    this.directory = directory
    this.envFile = envFile || findEnvFiles(directory)
    // calculated
    this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
    this.envVaultFilepath = path.resolve(this.directory, '.env.vault')
  }

  run () {
    if (this.envFile.length < 1) {
      const code = 'MISSING_ENV_FILES'
      const message = 'no .env* files found'
      const help = '? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]'

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const parsedDotenvKeys = this._parsedDotenvKeys()
    const parsedDotenvVaults = this._parsedDotenvVault()
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
      dotenvKeys,
      dotenvKeysFile,
      addedKeys,
      existingKeys
    } = new DotenvKeys([...uniqueEnvFilepaths], parsedDotenvKeys).run()

    // build look up of .env filepaths and their raw content
    const dotenvFiles = {}
    for (const filepath of [...uniqueEnvFilepaths]) {
      const raw = fs.readFileSync(filepath, ENCODING)
      dotenvFiles[filepath] = raw
    }

    // generate .env.vault string
    const {
      dotenvVaultFile,
      addedVaults,
      existingVaults,
      addedDotenvFilenames
    } = new DotenvVault(dotenvFiles, dotenvKeys, parsedDotenvVaults).run()

    return {
      // from DotenvKeys
      dotenvKeys,
      dotenvKeysFile,
      addedKeys,
      existingKeys,
      // from DotenvVault
      dotenvVaultFile,
      addedVaults,
      existingVaults,
      addedDotenvFilenames,
      envFile: this.envFile
    }
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

    return dotenv.configDotenv(options).parsed
  }

  _parsedDotenvVault () {
    const options = {
      path: this.envVaultFilepath
    }

    return dotenv.configDotenv(options).parsed
  }
}

module.exports = Encrypt
