const path = require('path')
const globSync = require('glob').globSync

class Ls {
  constructor (directory = './', envFile = '.env*') {
    this.ignore = ['node_modules/**', '.git/**']

    this.cwd = path.resolve(directory)
    this.envFile = envFile
  }

  run () {
    return this._filepaths()
  }

  _filepaths () {
    const options = {
      ignore: this.ignore,
      cwd: this.cwd // context dirctory for globSync
    }

    const patterns = this._patterns()
    return globSync(patterns, options)
  }

  _patterns () {
    if (!Array.isArray(this.envFile)) {
      return `**/${this.envFile}`
    }

    const out = []

    for (let i = 0; i < this.envFile.length; i++) {
      const part = this.envFile[i]
      out.push(`**/${part}`)
    }
    return out
  }
}

module.exports = Ls
