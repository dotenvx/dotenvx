const path = require('path')

const Ls = require('./ls')
const Run = require('./run')

const containsDirectory = require('./../helpers/containsDirectory')

class Status {
  constructor () {
    this.filteredFiles = []
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

      // track
      this.filteredFiles.push(filepath)

      // unencrypted
      const unencrypted = {}
      const unencryptedEnvs = [
        { type: 'envFile', value: filepath }
      ]
      new Run(unencryptedEnvs, false, '', unencrypted).run()

      // encrypted
      const encrypted = {}
      const vaultFilepath = path.join(path.dirname(filepath), '.env.vault')
      const encryptedEnvs = [
        { type: 'envFile', value: vaultFilepath }
      ]
      new Run(encryptedEnvs, false, '', encrypted).run()

      console.log('filepath', filepath)
      console.log('unencrypted', unencrypted)
      console.log('encrypted', encrypted)

      // handle scenario when .env.keys does not exist
      // handle scenario when .env.vault does not exist
      // handle scenario when an environment does not exist in .env.keys
      // handle scenario when an environment does not exist in .env.vault

      // compare it to the .env.vault file
    }

    // decrypt the .env.vault associated with it
    // iterate over the keys and compare to each other
    return this.filteredFiles
  }
}

module.exports = Status
