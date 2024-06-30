const { fdir: Fdir } = require('fdir')
const path = require('path')
const picomatch = require('picomatch')

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
    const ignoreMatchers = this.ignore.map(pattern => picomatch(pattern))
    const pathMatchers = this._patterns().map(pattern => picomatch(pattern))

    const api = new Fdir()
      .withRelativePaths()
      .exclude((dir, path) => ignoreMatchers.some(matcher => matcher(path)))
      .filter((path) => pathMatchers.some(matcher => matcher(path)))

    return api.crawl(this.cwd).sync()
  }

  _patterns () {
    if (!Array.isArray(this.envFile)) {
      return [`**/${this.envFile}`]
    }

    return this.envFile.map(part => `**/${part}`)
  }
}

module.exports = Ls
