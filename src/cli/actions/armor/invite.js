const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')
const ArmorInvite = require('../../../lib/services/armorInvite')

async function invite () {
  const options = this.opts()
  const sesh = new Session()
  await sesh.notifyUpdate()
  const hostname = options.hostname || sesh.hostname()
  const token = options.token || sesh.token()

  try {
    const { team, email } = await new ArmorInvite(hostname, token, options.team, options.email).run()
    logger.success(`⛨ invited ${email} to ${team}`)
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = invite
