const fs = require('fs')
const path = require('path')
const diff = require('diff')
const chalk = require('chalk')

const Ls = require('./ls')
const VaultDecrypt = require('./vaultDecrypt')

const containsDirectory = require('./../helpers/containsDirectory')
const guessEnvironment = require('./../helpers/guessEnvironment')

const ENCODING = 'utf8'

class Status {
  constructor (directory = '.') {
    this.directory = directory
    this.changes = []
    this.nochanges = []
    this.untracked = [] // not tracked in .env.vault
  }

  run () {
    // get list of .env files
    const files = new Ls(this.directory).run()
    // iterate over each one
    for (const filename of files) {
      // skip file if directory
      if (containsDirectory(filename)) {
        continue
      }

      // skip file if .env.keys
      if (filename.endsWith('.env.keys')) {
        continue
      }

      // skip file if .env.vault
      if (filename.endsWith('.env.vault')) {
        continue
      }

      // skip file if .env.example
      if (filename.endsWith('.env.example')) {
        continue
      }

      // skip file if *.previous
      if (filename.endsWith('.previous')) {
        continue
      }

      const filepath = path.resolve(this.directory, filename)

      const row = {}
      row.filename = filename
      row.filepath = filepath
      row.environment = guessEnvironment(filepath)

      // grab raw
      row.raw = fs.readFileSync(filepath, { encoding: ENCODING })

      // grab decrypted
      const { processedEnvs } = new VaultDecrypt(this.directory, row.environment).run()
      const result = processedEnvs[0]

      // handle warnings
      row.decrypted = result.decrypted
      if (result.warning) {
        this.untracked.push(row)
        continue
      }

      // differences
      row.differences = diff.diffWords(row.decrypted, row.raw)

      // any changes?
      const hasChanges = this._hasChanges(row.differences)

      if (hasChanges) {
        row.coloredDiff = row.differences.map(this._colorizeDiff).join('')
        this.changes.push(row)
      } else {
        this.nochanges.push(row)
      }
    }

    return {
      changes: this.changes,
      nochanges: this.nochanges,
      untracked: this.untracked
    }
  }

  _colorizeDiff (part) {
    // If the part was added, color it green
    if (part.added) {
      return chalk.green(part.value)
    }

    // If the part was removed, color it red
    if (part.removed) {
      return chalk.red(part.value)
    }

    // No color for unchanged parts
    return part.value
  }

  _hasChanges (differences) {
    return differences.some(part => part.added || part.removed)
  }
}

module.exports = Status
