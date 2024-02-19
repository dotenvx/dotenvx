const path = require('path')

const DotenvKeys = require('../helpers/dotenvKeys')

class Encrypt {
  constructor (directory = '.') {
    this.directory = directory
  }

  run () {
    const { envKeys, addedKeys, existingKeys } = new DotenvKeys(this.directory).run()

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
