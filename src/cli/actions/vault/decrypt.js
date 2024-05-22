const fs = require('fs')

const { logger } = require('./../../../shared/logger')
const createSpinner = require('./../../../shared/createSpinner')
const sleep = require('./../../../lib/helpers/sleep')

const Decrypt = require('./../../../lib/services/decrypt')

const spinner = createSpinner('decrypting')

async function decrypt (directory) {
  spinner.start()
  await sleep(500) // better dx

  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      processedEnvs,
      changedFilenames,
      unchangedFilenames
    } = new Decrypt(directory, options.environment).run()

    for (const env of processedEnvs) {
      if (env.warning) {
        const warning = env.warning
        logger.warn(warning.message)
      } else {
        if (env.shouldWrite) {
          logger.debug(`writing ${env.filepath}`)
          fs.writeFileSync(env.filepath, env.decrypted)
        } else {
          logger.debug(`no changes for ${env.filename}`)
        }
      }
    }

    let changedMsg = ''
    if (changedFilenames.length > 0) {
      changedMsg = `decrypted (${changedFilenames.join(', ')})`
    }

    let unchangedMsg = ''
    if (unchangedFilenames.length > 0) {
      unchangedMsg = `no changes (${unchangedFilenames.join(', ')})`
    }

    if (changedMsg.length > 0) {
      spinner.succeed(`${changedMsg} ${unchangedMsg}`)
    } else {
      spinner.done(`${unchangedMsg}`)
    }
  } catch (error) {
    spinner.fail(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    if (error.debug) {
      logger.debug(error.debug)
    }
    if (error.code) {
      logger.debug(`ERROR_CODE: ${error.code}`)
    }
    process.exit(1)
  }
}

module.exports = decrypt
