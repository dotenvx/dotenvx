const fs = require('fs')

const { logger } = require('./../../../../shared/logger')

const VaultDecrypt = require('./../../../../lib/services/vaultDecrypt')

function decrypt (directory) {
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      processedEnvs,
      changedFilenames,
      unchangedFilenames
    } = new VaultDecrypt(directory, options.environment).run()

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
      logger.success(`${changedMsg} ${unchangedMsg}`)
    } else {
      logger.blank(`${unchangedMsg}`)
    }
  } catch (error) {
    logger.error(error.message)
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
