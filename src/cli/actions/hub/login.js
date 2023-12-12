const ora = require('ora')
const open = require('open')
const axios = require('axios')
const qrcode = require('qrcode-terminal')
const clipboardy = require('clipboardy')
const { confirm } = require('@inquirer/prompts')

const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')
const helpers = require('./../../helpers')

const OAUTH_CLIENT_ID = 'oac_dotenvxcli'
const spinner = ora('waiting on user authorization')

async function pollTokenUrl (tokenUrl, deviceCode, interval) {
  logger.debug(`POST ${tokenUrl} with deviceCode ${deviceCode} at interval ${interval}`)

  try {
    const response = await axios.post(tokenUrl, {
      client_id: OAUTH_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })

    logger.debug(response.data)

    if (response.data.access_token) {
      spinner.start()
      store.set('DOTENVX_TOKEN', response.data.access_token)
      spinner.succeed(`IMPLEMENT NEXT: ${response.data.access_token}`) // place in conf
      process.exit(0)
    } else {
      // continue polling if no access_token. shouldn't ever get here it server is implemented correctly
      setTimeout(() => pollTokenUrl(tokenUrl, deviceCode, interval), interval * 1000)
    }
  } catch (error) {
    if (error.response && error.response.data) {
      logger.debug(error.response.data)

      // continue polling if authorization_pending
      if (error.response.data.error === 'authorization_pending') {
        setTimeout(() => pollTokenUrl(tokenUrl, deviceCode, interval), interval * 1000)
      } else {
        spinner.start()
        spinner.fail(error.response.data.error_description)
        process.exit(1)
      }
    } else {
      spinner.start()
      spinner.fail(error)
      process.exit(1)
    }
  }
}

async function login () {
  const options = this.opts()
  logger.debug('configuring options')
  logger.debug(options)

  const hostname = options.hostname
  const deviceCodeUrl = `${hostname}/oauth/device/code`
  const tokenUrl = `${hostname}/oauth/token`

  logger.blank('logging you in...')

  try {
    const response = await axios.post(deviceCodeUrl, {
      client_id: OAUTH_CLIENT_ID
    })
    const data = response.data
    const deviceCode = data.device_code
    const userCode = data.user_code
    const verificationUri = data.verification_uri
    const interval = data.interval

    try { clipboardy.writeSync(userCode) } catch (_e) {}

    qrcode.generate(verificationUri, { small: true })

    // begin polling
    pollTokenUrl(tokenUrl, deviceCode, interval)

    // optionally allow user to open browser
    const answer = await confirm({ message: `press Enter to open [${verificationUri}] and enter code [${helpers.formatCode(userCode)}]...` })

    if (answer) {
      await open(verificationUri)

      spinner.start()
    }
  } catch (error) {
    if (error.response && error.response.data) {
      logger.debug(error.response.data)

      spinner.start()
      spinner.fail(error.response.data.error_description)
      process.exit(1)
    } else {
      spinner.start()
      spinner.fail(error.toString())
      process.exit(1)
    }
  }
}

module.exports = login
