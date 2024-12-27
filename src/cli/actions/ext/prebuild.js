const { logger } = require('./../../../shared/logger')

const Prebuild = require('./../../../lib/services/prebuild')

function prebuild () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      successMessage,
      warnings
    } = new Prebuild(options).run()

    for (const warning of warnings) {
      logger.warn(warning.message)
      if (warning.help) {
        logger.help(warning.help)
      }
    }

    logger.success(successMessage)
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }

    process.exit(1)
  }
}

module.exports = prebuild

// function prebuild () {
//   const options = this.opts()
//   logger.debug(`options: ${JSON.stringify(options)}`)
//
//   // 1. check for .dockerignore file
//   if (!fsx.existsSync('.dockerignore')) {
//     logger.error('.dockerignore missing')
//     logger.help('? add it with [touch .dockerignore]')
//     process.exit(1)
//     return
//   }
//
//   // 2. check .env* files against .dockerignore file
//   let warningCount = 0
//   const ig = ignore().add(fsx.readFileX('.dockerignore'))
//   const files = fsx.readdirSync(process.cwd())
//   const dotenvFiles = files.filter(file => file.match(/^\.env(\..+)?$/))
//   dotenvFiles.forEach(file => {
//     // check if that file is being ignored
//     if (ig.ignores(file)) {
//       switch (file) {
//         case '.env.example':
//           warningCount += 1
//           logger.warn(`${file} (currently ignored but should not be)`)
//           logger.help(`? add !${file} to .dockerignore with [echo "!${file}" >> .dockerignore]`)
//           break
//         case '.env.vault':
//           warningCount += 1
//           logger.warn(`${file} (currently ignored but should not be)`)
//           logger.help(`? add !${file} to .dockerignore with [echo "!${file}" >> .dockerignore]`)
//           break
//         default:
//           break
//       }
//     } else {
//       switch (file) {
//         case '.env.example':
//           break
//         case '.env.vault':
//           break
//         default:
//           logger.error(`${file} not properly dockerignored`)
//           logger.help(`? add ${file} to .dockerignore with [echo ".env*" >> .dockerignore]`)
//           process.exit(1) // 3.1 exit early with error code
//           break
//       }
//     }
//   })
//
//   // 3. outpout success
//   if (warningCount > 0) {
//     logger.success(`success (with ${pluralize('warning', warningCount)})`)
//   } else {
//     logger.success('success')
//   }
// }

module.exports = prebuild
