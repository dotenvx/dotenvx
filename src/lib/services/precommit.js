/* istanbul ignore file */
const fs = require('fs')
const ignore = require('ignore')

const pluralize = require('./../helpers/pluralize')
const isFullyEncrypted = require('./../helpers/isFullyEncrypted')
const InstallPrecommitHook = require('./../helpers/installPrecommitHook')
const MISSING_GITIGNORE = '.env.keys' // by default only ignore .env.keys. all other .env* files COULD be included - as long as they are encrypted

class Precommit {
  constructor (options = {}) {
    this.install = options.install
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
      const files = fs.readdirSync(process.cwd())
      const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
      dotenvFiles.forEach(file => {
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

  _installPrecommitHook () {
    return new InstallPrecommitHook().run()
  }
}

module.exports = Precommit
