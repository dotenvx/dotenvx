const open = require('open')
const axios = require('./../../../shared/axios')
const clipboardy = require('clipboardy')
const { confirm } = require('@inquirer/prompts')

const createSpinner = require('./../../../shared/createSpinner')
const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')
const helpers = require('./../../helpers')

const OAUTH_CLIENT_ID = 'oac_dotenvxcli'

const spinner = createSpinner('waiting on user authorization')

async function pollTokenUrl (tokenUrl, deviceCode, interval) {
  logger.http(`POST ${tokenUrl} with deviceCode ${deviceCode} at interval ${interval}`)

  try {
    const response = await axios.post(tokenUrl, {
      client_id: OAUTH_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })

    logger.http(response.data)

    if (response.data.access_token) {
      spinner.start()
      store.setToken(response.data.full_username, response.data.access_token)
      store.setHostname(response.data.hostname)
      spinner.succeed(`logged in as ${response.data.username}`)
      process.exit(0)
    } else {
      // continue polling if no access_token. shouldn't ever get here it server is implemented correctly
      setTimeout(() => pollTokenUrl(tokenUrl, deviceCode, interval), interval * 1000)
    }
  } catch (error) {
    if (error.response && error.response.data) {
      logger.http(error.response.data)

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
  logger.debug(`options: ${JSON.stringify(options)}`)

  const hostname = options.hostname
  const deviceCodeUrl = `${hostname}/oauth/device/code`
  const tokenUrl = `${hostname}/oauth/token`

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

    // qrcode.generate(verificationUri, { small: true }) // too verbose

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
      logger.http(error.response.data)

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
