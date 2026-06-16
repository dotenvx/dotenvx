const { logger } = require('../../../shared/logger')
const Session = require('./../../../db/session')
const ArmorMove = require('./../../../lib/services/armorMove')
const createSpinner = require('../../../lib/helpers/createSpinner')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

async function move () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'moving' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  await sesh.notifyUpdate()
  const hostname = options.hostname || sesh.hostname()
  const token = options.token || sesh.token()

  try {
    const devicePublicKey = sesh.devicePublicKey()

    const {
      changed,
      privateKeyName,
      publicKeyValue,
      team
    } = await new ArmorMove(hostname, token, devicePublicKey, options.envFile).run()
    const keyDisplay = armoredKeyDisplay(publicKeyValue) || privateKeyName

    if (spinner) spinner.stop()
    if (changed) {
      logger.success(`⛨ moved to ${team} (${keyDisplay})`)
    } else {
      logger.info(`○ no change (${keyDisplay})`)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    logger.error(error.message)
    process.exit(1)
  }
}

module.exports = move
