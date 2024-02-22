const fs = require('fs')
const ignore = require('ignore')
const logger = require('./../../shared/logger')
const helpers = require('./../../cli/helpers')

const InstallPrecommitHook = require('./../helpers/installPrecommitHook')

class Precommit {
  constructor (options = {}) {
    this.install = options.install
  }

  run () {
    if (this.install) {
      this._installPrecommitHook()

      return true
    }

    // 1. check for .gitignore file
    if (!fs.existsSync('.gitignore')) {
      logger.errorvp('.gitignore missing')
      logger.help2('? add it with [touch .gitignore]')
      process.exit(1)
    }

    // 2. check .env* files against .gitignore file
    let warningCount = 0
    const ig = ignore().add(fs.readFileSync('.gitignore').toString())
    const files = fs.readdirSync(process.cwd())
    const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
    dotenvFiles.forEach(file => {
      // check if that file is being ignored
      if (ig.ignores(file)) {
        switch (file) {
          case '.env.example':
            warningCount += 1
            logger.warnv(`${file} (currently ignored but should not be)`)
            logger.help2(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
            break
          case '.env.vault':
            warningCount += 1
            logger.warnv(`${file} (currently ignored but should not be)`)
            logger.help2(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
            break
          default:
            break
        }
      } else {
        switch (file) {
          case '.env.example':
            break
          case '.env.vault':
            break
          default:
            logger.errorvp(`${file} not properly gitignored`)
            logger.help2(`? add ${file} to .gitignore with [echo ".env*" >> .gitignore]`)
            process.exit(1) // 3.1 exit early with error code
            break
        }
      }
    })

    // 3. outpout success
    if (warningCount > 0) {
      logger.successvp(`success (with ${helpers.pluralize('warning', warningCount)})`)
    } else {
      logger.successvp('success')
    }
  }

  /* istanbul ignore next */
  _installPrecommitHook () {
    new InstallPrecommitHook().run()
  }
}

module.exports = Precommit
