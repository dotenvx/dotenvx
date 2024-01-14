const fs = require('fs')

const ignore = require('ignore')

const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const createSpinner = require('./../../shared/createSpinner')

async function precommit () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // 1. check for .gitignore file
  let spinner
  if (!fs.existsSync('.gitignore')) {
    spinner = createSpinner('.gitignore')
    spinner.start()
    await helpers.sleep(500) // better dx
    spinner.fail('.gitignore missing')
    logger.help('? add it with [touch .gitignore]')
    process.exit(1)
  }

  const ig = ignore().add(fs.readFileSync('.gitignore').toString())
  const files = fs.readdirSync(process.cwd())
  const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
  dotenvFiles.forEach(file => {
    // check if that file is being ignored
    spinner = createSpinner(file)
    spinner.start()
    if (ig.ignores(file)) {
      switch (file) {
        case '.env.example':
          spinner.warn(`${file} (currently ignored but should not be)`)
          logger.help(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        case '.env.vault':
          spinner.warn(`${file} (currently ignored but should not be)`)
          logger.help(`? add !${file} to .gitignore with [echo "!${file}" >> .gitignore]`)
          break
        default:
          spinner.succeed(file)
          break
      }
    } else {
      switch (file) {
        case '.env.example':
          spinner.succeed('.env.example') // should not be ignored
          break
        case '.env.vault':
          spinner.succeed('.env.vault') // should not be ignored
          break
        default:
          spinner.fail(file)
          logger.help(`? add ${file} to .gitignore with [echo ".env*" >> .gitignore]`)
          process.exit(1)
          break
      }
    }
  })
}

module.exports = precommit
