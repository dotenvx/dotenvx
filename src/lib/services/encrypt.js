const path = require('path')

class Encrypt {
  constructor (directory = '.') {
    this.cwd = path.resolve(directory)
  }

  run () {
    return 'implement'
  }
}

module.exports = Encrypt
