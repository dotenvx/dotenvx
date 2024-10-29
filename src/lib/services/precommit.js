/* istanbul ignore file */
const fsx = require('./../helpers/fsx')
const ignore = require('ignore')

const Ls = require('../services/ls')

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
      let count = 0
      const warnings = []
      let gitignore = MISSING_GITIGNORE

      // 1. check for .gitignore file
      if (!fsx.existsSync('.gitignore')) {
        const warning = new Error('.gitignore missing')
        warning.help = '? add it with [touch .gitignore]'
        warnings.push(warning)
      } else {
        gitignore = fsx.readFileX('.gitignore')
      }

      // 2. check .env* files against .gitignore file
      const ig = ignore().add(gitignore)
      const lsService = new Ls(process.cwd(), undefined, this.excludeEnvFile)
      const dotenvFiles = lsService.run()
      dotenvFiles.forEach(file => {
        count += 1

        // check if file is going to be commited
        if (this._isFileToBeCommitted(file)) {
          // check if that file is being ignored
          if (ig.ignores(file)) {
            if (file === '.env.example' || file === '.env.vault') {
              const warning = new Error(`${file} (currently ignored but should not be)`)
              warning.help = `? add !${file} to .gitignore [echo "!${file}" >> .gitignore]`
              warnings.push(warning)
            }
          } else {
            if (file !== '.env.example' && file !== '.env.vault') {
              const src = fsx.readFileX(file)
              const encrypted = isFullyEncrypted(src)

              // if contents are encrypted don't raise an error
              if (!encrypted) {
                const error = new Error(`${file} not protected (encrypted or gitignored)`)
                error.help = `? encrypt it [dotenvx encrypt -f ${file}] or gitignore it [echo "${file}" >> .gitignore]`
                throw error
              }
            }
          }
        }
      })

      let successMessage = `.env files (${count}) protected (encrypted or gitignored)`
      if (count === 0) {
        successMessage = 'zero .env files'
      }
      if (warnings.length > 0) {
        successMessage += ` with warnings (${warnings.length})`
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
