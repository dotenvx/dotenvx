const path = require('path')

const DotenvKeys = require('./../helpers/dotenvKeys')

class Encrypt {
  constructor (directory = '.', envFile = '.env') {
    this.directory = directory
    this.envFile = envFile
  }

  run () {
    const { envKeys, addedKeys, existingKeys } = new DotenvKeys(this.directory, this.envFile).run()

    return {
      envKeys: envKeys,
      addedKeys: addedKeys,
      existingKeys: existingKeys,
      envVault: this.envVault()
    }
  }

  envVault () {
    return '<env vault file>'
  }
}

module.exports = Encrypt
