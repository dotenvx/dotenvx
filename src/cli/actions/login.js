const { logger } = require('../../shared/logger')

const Session = require('../../db/session')
const Login = require('../../lib/services/login')

const createSpinner = require('../../lib/helpers/createSpinner')
const formatCode = require('../../lib/helpers/formatCode')
const listenForOpenKey = require('../../lib/helpers/listenForOpenKey')
const openUrl = require('../../lib/helpers/openUrl')

const FRAMES = ['◐', '◓', '◑', '◒']

async function login () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'logging in', frames: FRAMES })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  const hostname = options.hostname || sesh.hostname()
  let cleanupOpenKeyListener = () => {}
  let loginService

  try {
    loginService = new Login(hostname)
    const {
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete,
      interval
    } = await loginService.run()

    const promptMessage = `◌ press Enter to open [${verificationUri}] and enter code [${formatCode(userCode)}]...`

    logger.debug(`POST ${hostname} with deviceCode ${deviceCode} at interval ${interval}`)
    logger.info(promptMessage)

    // begin polling
    const pollPromise = loginService.poll(deviceCode, interval)
    cleanupOpenKeyListener = listenForOpenKey(() => openUrl(verificationUriComplete))
    const data = await pollPromise

    cleanupOpenKeyListener()
    if (spinner) spinner.stop()
    logger.success(`◉ logged in (${data.username})`)
    process.exit(0)
  } catch (error) {
    cleanupOpenKeyListener()
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

module.exports = login
