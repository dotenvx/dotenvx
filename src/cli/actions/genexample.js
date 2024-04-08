const fs = require('fs')
const main = require('./../../lib/main')
const logger = require('./../../shared/logger')
const createSpinner = require('./../../shared/createSpinner')

const sleep = require('./../../lib/helpers/sleep')

const spinner = createSpinner('generating')

const ENCODING = 'utf8'

async function genexample (directory) {
  spinner.start()
  await sleep(500) // better dx

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
      spinner.succeed(`updated .env.example (${addedKeys.length})`)
    } else {
      spinner.done('no changes (.env.example)')
    }
  } catch (error) {
    spinner.fail(error.message)
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
