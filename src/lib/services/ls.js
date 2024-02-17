const path = require('path')
const globSync = require('glob').globSync

class Ls {
  constructor (directory = null) {
    this.cwd = directory ? path.resolve(directory) : './'
    this.ignore = ['node_modules/**', '.git/**']
  }

  run () {
    return this._filepaths()
  }

  _filepaths () {
    const options = {
      ignore: this.ignore,
      cwd: this.cwd // context dirctory for globSync
    }

    return globSync('**/.env*', options)
  }
}

module.exports = Ls
