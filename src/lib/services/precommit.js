/* istanbul ignore file */
const fs = require('fs')
const ignore = require('ignore')

const pluralize = require('./../helpers/pluralize')
const InstallPrecommitHook = require('./../helpers/installPrecommitHook')

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

      // 1. check for .gitignore file
      if (!fs.existsSync('.gitignore')) {
        const error = new Error('.gitignore missing')
        error.help = '? add it with [touch .gitignore]'
        throw error
      }

      // 2. check .env* files against .gitignore file
      const ig = ignore().add(fs.readFileSync('.gitignore').toString())
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
            const error = new Error(`${file} not properly gitignored`)
            error.help = `? add ${file} to .gitignore with [echo ".env*" >> .gitignore]`
            throw error
          }
        }
      })

      let successMessage = 'success'
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
