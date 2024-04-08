const fs = require('fs')

const ignore = require('ignore')

const logger = require('./../../shared/logger')
const pluralize = require('./../../lib/helpers/pluralize')

function prebuild () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // 1. check for .dockerignore file
  if (!fs.existsSync('.dockerignore')) {
    logger.errorvpb('.dockerignore missing')
    logger.help2('? add it with [touch .dockerignore]')
    process.exit(1)
  }

  // 2. check .env* files against .dockerignore file
  let warningCount = 0
  const ig = ignore().add(fs.readFileSync('.dockerignore').toString())
  const files = fs.readdirSync(process.cwd())
  const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
  dotenvFiles.forEach(file => {
    // check if that file is being ignored
    if (ig.ignores(file)) {
      switch (file) {
        case '.env.example':
          warningCount += 1
          logger.warnv(`${file} (currently ignored but should not be)`)
          logger.help2(`? add !${file} to .dockerignore with [echo "!${file}" >> .dockerignore]`)
          break
        case '.env.vault':
          warningCount += 1
          logger.warnv(`${file} (currently ignored but should not be)`)
          logger.help2(`? add !${file} to .dockerignore with [echo "!${file}" >> .dockerignore]`)
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
          logger.errorvpb(`${file} not properly dockerignored`)
          logger.help2(`? add ${file} to .dockerignore with [echo ".env*" >> .dockerignore]`)
          process.exit(1) // 3.1 exit early with error code
          break
      }
    }
  })

  // 3. outpout success
  if (warningCount > 0) {
    logger.successvpb(`success (with ${pluralize('warning', warningCount)})`)
  } else {
    logger.successvpb('success')
  }
}

module.exports = prebuild
