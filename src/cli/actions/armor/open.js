const { logger } = require('../../../shared/logger')
const Session = require('./../../../db/session')
const ArmorOpen = require('./../../../lib/services/armorOpen')
const openUrl = require('../../../lib/helpers/openUrl')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

async function open () {
  const options = this.opts()

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  await sesh.notifyUpdate()
  const hostname = options.hostname || sesh.hostname()

  try {
    const { url, publicKeyValue } = new ArmorOpen(hostname, options.envFile).run()
    const keyDisplay = armoredKeyDisplay(publicKeyValue)

    await openUrl(url)
    logger.success(`◌ opened (${keyDisplay})`)
  } catch (error) {
    logger.error(error.message)
    process.exit(1)
  }
}

module.exports = open
