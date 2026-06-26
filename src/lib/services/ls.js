const path = require('path')
const lsResolver = require('./../resolvers/ls')

class Ls {
  constructor (directory = './', envFile = ['.env*'], excludeEnvFile = []) {
    this.ignore = ['node_modules/**', '.git/**']

    this.cwd = path.resolve(directory)
    this.envFile = envFile
    this.excludeEnvFile = excludeEnvFile
  }

  run () {
    return this._filepaths()
  }

  _filepaths () {
    return lsResolver({
      directory: this.cwd,
      envFile: this.envFile,
      excludeEnvFile: this.excludeEnvFile
    })
  }

  _patterns () {
    if (!Array.isArray(this.envFile)) {
      return [`**/${this.envFile}`]
    }

    return this.envFile.map(part => `**/${part}`)
  }

  _excludePatterns () {
    if (!Array.isArray(this.excludeEnvFile)) {
      return [`**/${this.excludeEnvFile}`]
    }

    return this.excludeEnvFile.map(part => `**/${part}`)
  }

  _exclude () {
    if (this._excludePatterns().length > 0) {
      return this.ignore.concat(this._excludePatterns())
    } else {
      return this.ignore
    }
  }
}

module.exports = Ls
