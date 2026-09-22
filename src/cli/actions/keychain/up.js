const { logger } = require('../../../shared/logger')
const KeychainUp = require('./../../../lib/services/keychainUp')
const createSpinner = require('../../../lib/helpers/createSpinner')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

async function up () {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'storing' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const { changed, privateKeyName, publicKeyValue } = new KeychainUp(options.envFile, options.envKeysFile).run()
    const keyDisplay = armoredKeyDisplay(publicKeyValue) || privateKeyName

    if (spinner) spinner.stop()
    if (changed) {
      logger.success(`⌥ stored (${keyDisplay})`)
    } else {
      logger.info(`○ no change (${keyDisplay})`)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = up
