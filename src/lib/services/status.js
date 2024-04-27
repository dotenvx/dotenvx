const fs = require('fs')
const path = require('path')
const diff = require('diff')
const chalk = require('chalk')

const Ls = require('./ls')
const Run = require('./run')
const Decrypt = require('./decrypt')

const containsDirectory = require('./../helpers/containsDirectory')
const guessEnvironment = require('./../helpers/guessEnvironment')

const ENCODING = 'utf8'

class Status {
  constructor () {
    this.changes = []
    this.nochanges = []
  }

  run () {
    // get list of .env files
    const files = new Ls('./').run()
    // iterate over each one
    for (const filepath of files) {
      // skip file if directory
      if (containsDirectory(filepath)) {
        continue
      }

      // skip file if .env.keys
      if (filepath.endsWith('.env.keys')) {
        continue
      }

      // skip file if .env.vault
      if (filepath.endsWith('.env.vault')) {
        continue
      }

      // skip file if *.previous
      if (filepath.endsWith('.previous')) {
        continue
      }

      const row = {}
      row.filepath = filepath
      row.environment = guessEnvironment(filepath)

      // grab raw
      row.raw = fs.readFileSync(filepath, { encoding: ENCODING })

      // grab decrypted
      const { processedEnvs } = new Decrypt('.', row.environment).run()
      row.decrypted = processedEnvs[0].decrypted

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
      nochanges: this.nochanges
    }
  }

  _colorizeDiff(part) {
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

  _hasChanges(differences) {
    return differences.some(part => part.added || part.removed)
  }
}

module.exports = Status
