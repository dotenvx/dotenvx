const fs = require('fs')

const ignore = require('ignore')

const logger = require('./../../shared/logger')
const helpers = require('./../helpers')

async function precommit () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // 1. check for .gitignore file
  if (!fs.existsSync('.gitignore')) {
    logger.error('.gitignore missing')
    logger.help('? add it with [touch .gitignore]')
    process.exit(1)
  }

  const ig = ignore().add(fs.readFileSync('.gitignore').toString())
  const files = fs.readdirSync(process.cwd())
  const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
  dotenvFiles.forEach(file => {
    // check if that file is being ignored
    if (ig.ignores(file)) {
      switch (file) {
        case '.env.example':
          logger.warn(`${file} (currently ignored but should not be)`)
          logger.help(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        case '.env.vault':
          logger.warn(`${file} (currently ignored but should not be)`)
          logger.help(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        default:
          logger.success(file)
          break
      }
    } else {
      switch (file) {
        case '.env.example':
          logger.success('.env.example') // should not be ignored
          break
        case '.env.vault':
          logger.success('.env.vault') // should not be ignored
          break
        default:
          logger.error(`${file} not properly gitignored`)
          logger.help(`? add ${file} to .gitignore with [echo ".env*" >> .gitignore]`)
          process.exit(1)
          break
      }
    }
  })
}

module.exports = precommit
