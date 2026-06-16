const { logger } = require('../../../shared/logger')
const Session = require('./../../../db/session')
const ArmorPull = require('./../../../lib/services/armorPull')
const createSpinner = require('../../../lib/helpers/createSpinner')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

async function pull () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'pulling' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  await sesh.notifyUpdate()
  const hostname = options.hostname || sesh.hostname()
  const token = options.token || sesh.token()

  try {
    const devicePublicKey = sesh.devicePublicKey()

    const { changed, privateKeyName, publicKeyValue } = await new ArmorPull(hostname, token, devicePublicKey, options.envFile, options.team).run()
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
    process.exit(1)
  }
}

module.exports = pull
