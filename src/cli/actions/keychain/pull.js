const { logger } = require('../../../shared/logger')
const KeychainPull = require('./../../../lib/services/keychainPull')
const createSpinner = require('../../../lib/helpers/createSpinner')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

async function pull () {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'pulling' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const { changed, privateKeyName, publicKeyValue } = new KeychainPull(options.envFile, options.envKeysFile).run()
    const keyDisplay = armoredKeyDisplay(publicKeyValue) || privateKeyName

    if (spinner) spinner.stop()
    if (changed) {
      logger.success(`◇ pulled to .env.keys (${keyDisplay})`)
    } else {
      logger.info(`○ no change (${keyDisplay})`)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = pull
