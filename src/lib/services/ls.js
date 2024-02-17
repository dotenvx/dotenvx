const globSync = require('glob').globSync

class Ls {
  constructor() {
    this.ignore = ['node_modules/**', '.git/**']
  }

  run () {
    return this._filepaths()
  }

  _filepaths () {
    const options = { ignore: this.ignore }
    return globSync('**/.env*', options)
  }
}

module.exports = Ls
