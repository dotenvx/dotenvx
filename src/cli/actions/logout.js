const { logger } = require('../../shared/logger')

const Session = require('../../db/session')
const Logout = require('../../lib/services/logout')
const createSpinner = require('../../lib/helpers/createSpinner')

const FRAMES = ['◐', '◓', '◑', '◒']

async function logout () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'logging out', frames: FRAMES })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  const hostname = options.hostname || sesh.hostname()

  try {
    const data = await new Logout(hostname).run()
    if (spinner) spinner.stop()
    logger.success(`◌ logged out (${data.username})`)
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.message) {
      logger.error(error.message)
    } else {
      logger.error(error)
    }
    if (error.stack) {
      logger.debug(error.stack)
    }
    process.exit(1)
  }
}

module.exports = logout
