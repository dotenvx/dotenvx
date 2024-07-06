const fs = require('fs')
const main = require('./../../../lib/main')
const { logger } = require('./../../../shared/logger')

const ENCODING = 'utf8'

function genexample (directory) {
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      envExampleFile,
      envFile,
      exampleFilepath,
      addedKeys
    } = main.genexample(directory, options.envFile)

    logger.verbose(`loading env from ${envFile}`)

    // TODO: display pre-existing
    // TODO: display added/appended/injected

    fs.writeFileSync(exampleFilepath, envExampleFile, ENCODING)

    if (addedKeys.length > 0) {
      logger.success(`updated .env.example (${addedKeys.length})`)
    } else {
      logger.blank('no changes (.env.example)')
    }
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    if (error.code) {
      logger.debug(`ERROR_CODE: ${error.code}`)
    }
    process.exit(1)
  }
}

module.exports = genexample
