const open = require('open')
const { request } = require('undici')
const clipboardy = require('./../../../lib/helpers/clipboardy')
const confirm = require('@inquirer/confirm').default

const createSpinner = require('./../../../shared/createSpinner')
const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')

const OAUTH_CLIENT_ID = 'oac_dotenvxcli'

const spinner = createSpinner('waiting on user authorization')

const formatCode = function (str) {
  const parts = []

  for (let i = 0; i < str.length; i += 4) {
    parts.push(str.substring(i, i + 4))
  }

  return parts.join('-')
}

async function pollTokenUrl (tokenUrl, deviceCode, interval) {
  logger.http(`POST ${tokenUrl} with deviceCode ${deviceCode} at interval ${interval}`)

  try {
    const response = await request(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: OAUTH_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })

    const responseData = await response.body.json()

    logger.http(responseData)

    if (response.statusCode >= 400) {
      // continue polling if authorization_pending
      if (responseData.error === 'authorization_pending') {
        setTimeout(() => pollTokenUrl(tokenUrl, deviceCode, interval), interval * 1000)
      } else {
        spinner.start()
        spinner.fail(responseData.error_description)
        process.exit(1)
      }
    }

    if (responseData.access_token) {
      spinner.start()
      store.setToken(responseData.full_username, responseData.access_token)
      store.setHostname(responseData.hostname)
      spinner.succeed(`logged in as ${responseData.username}`)
      process.exit(0)
    } else {
      // continue polling if no access_token. shouldn't ever get here it server is implemented correctly
      setTimeout(() => pollTokenUrl(tokenUrl, deviceCode, interval), interval * 1000)
    }
  } catch (error) {
    spinner.start()
    spinner.fail(error.toString())
    process.exit(1)
  }
}

async function login () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const hostname = options.hostname
  const deviceCodeUrl = `${hostname}/oauth/device/code`
  const tokenUrl = `${hostname}/oauth/token`

  try {
    const response = await request(deviceCodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ client_id: OAUTH_CLIENT_ID })
    })

    const responseData = await response.body.json()

    if (response.statusCode >= 400) {
      logger.http(responseData)

      spinner.start()
      spinner.fail(responseData.error_description)
      process.exit(1)
    }

    const deviceCode = responseData.device_code
    const userCode = responseData.user_code
    const verificationUri = responseData.verification_uri
    const interval = responseData.interval

    try { clipboardy.writeSync(userCode) } catch (_e) {}

    // qrcode.generate(verificationUri, { small: true }) // too verbose

    // begin polling
    pollTokenUrl(tokenUrl, deviceCode, interval)

    // optionally allow user to open browser
    const answer = await confirm({ message: `press Enter to open [${verificationUri}] and enter code [${formatCode(userCode)}]...` })

    if (answer) {
      await open(verificationUri)

      spinner.start()
    }
  } catch (error) {
    spinner.start()
    spinner.fail(error.toString())
    process.exit(1)
  }
}

module.exports = login
