const path = require('path')

class Encrypt {
  constructor (directory = '.') {
    this.cwd = path.resolve(directory)
  }

  run () {
    return {
      envKeys: this.envKeys(),
      envVault: this.envVault()
    }
  }

  envKeys () {
    return '<env keys file>'
  }

  envVault () {
    return '<env vault file>'
  }
}

module.exports = Encrypt
