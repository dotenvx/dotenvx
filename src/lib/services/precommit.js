/* istanbul ignore file */
const fs = require('fs')
const ignore = require('ignore')

const Ls = require('../services/ls')

const pluralize = require('./../helpers/pluralize')
const isFullyEncrypted = require('./../helpers/isFullyEncrypted')
const InstallPrecommitHook = require('./../helpers/installPrecommitHook')
const childProcess = require('child_process')
const MISSING_GITIGNORE = '.env.keys' // by default only ignore .env.keys. all other .env* files COULD be included - as long as they are encrypted

class Precommit {
  constructor (options = {}) {
    this.install = options.install
    this.excludeEnvFile = ['test/**', 'tests/**', 'spec/**', 'specs/**', 'pytest/**', 'test_suite/**']
  }

  run () {
    if (this.install) {
      const {
        successMessage
      } = this._installPrecommitHook()

      return {
        successMessage,
        warnings: []
      }
    } else {
      const warnings = []
      let successMessage = 'success'
      let gitignore = MISSING_GITIGNORE

      // 1. check for .gitignore file
      if (!fs.existsSync('.gitignore')) {
        const warning = new Error('.gitignore missing')
        warning.help = '? add it with [touch .gitignore]'
        warnings.push(warning)
      } else {
        gitignore = fs.readFileSync('.gitignore').toString()
      }

      // 2. check .env* files against .gitignore file
      const ig = ignore().add(gitignore)
      const lsService = new Ls(process.cwd(), undefined, this.excludeEnvFile)
      const dotenvFiles = lsService.run()
      dotenvFiles.forEach(file => {
        // check if file is going to be commited
        if (this._isFileToBeCommitted(file)) {
          // check if that file is being ignored
          if (ig.ignores(file)) {
            if (file === '.env.example' || file === '.env.vault') {
              const warning = new Error(`${file} (currently ignored but should not be)`)
              warning.help = `? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`
              warnings.push(warning)
            }
          } else {
            if (file !== '.env.example' && file !== '.env.vault') {
              const src = fs.readFileSync(file).toString()
              const encrypted = isFullyEncrypted(src)

              // if contents are encrypted don't raise an error
              if (!encrypted) {
                const error = new Error(`${file} not encrypted (or not gitignored)`)
                error.help = `? encrypt it with [dotenvx encrypt -f ${file}] or add ${file} to .gitignore with [echo ".env*" >> .gitignore]`
                throw error
              }
            }
          }
        }
      })

      if (warnings.length > 0) {
        successMessage = `success (with ${pluralize('warning', warnings.length)})`
      }

      return {
        successMessage,
        warnings
      }
    }
  }

  _isFileToBeCommitted (filePath) {
    try {
      const output = childProcess.execSync('git diff --cached --name-only').toString()
      const files = output.split('\n')

      return files.includes(filePath)
    } catch (error) {
      // consider file to be committed if there is an error (not using git)
      return true
    }
  }

  _installPrecommitHook () {
    return new InstallPrecommitHook().run()
  }
}

module.exports = Precommit
