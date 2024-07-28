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
    const exclude = picomatch(this.ignore)
    const include = picomatch(this._patterns(), {
      ignore: this.ignore
    })

    return new Fdir()
      .withRelativePaths()
      .exclude((dir, path) => exclude(path))
      .filter((path) => include(path))
      .crawl(this.cwd)
      .sync()
  }

  _patterns () {
    if (!Array.isArray(this.envFile)) {
      return [`**/${this.envFile}`]
    }

    return this.envFile.map(part => `**/${part}`)
  }
}

module.exports = Ls
