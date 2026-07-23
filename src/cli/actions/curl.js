const { logger } = require('../../shared/logger')
const Session = require('../../db/session')
const { http } = require('../../lib/helpers/http')
const catchAndLog = require('../../lib/helpers/catchAndLog')

function requestUrl (value, hostname) {
  const url = new URL(value)
  const trusted = new URL(hostname)

  if (url.origin !== trusted.origin) {
    throw new Error(`refusing to send Armor token to [${url.origin}]. expected [${trusted.origin}]`)
  }

  if (url.username || url.password) {
    throw new Error('refusing URL containing credentials')
  }

  return url.toString()
}

function requestBody (value) {
  if (value === undefined) return undefined

  try {
    return JSON.stringify(JSON.parse(value))
  } catch {
    throw new Error('invalid JSON passed to [--data]')
  }
}

function outputBody (value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

async function curl () {
  try {
    const options = this.opts()
    const session = new Session()
    const token = options.token || session.token()
    if (!token) throw new Error('missing token. Try [dotenvx login].')

    const body = requestBody(options.data)
    const method = (options.request || (body === undefined ? 'GET' : 'POST')).toUpperCase()
    const url = requestUrl(this.args[0], session.hostname())
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'dotenvx-device-public-key': session.devicePublicKey()
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    logger.debug(`request [${method} ${url}]`)
    const response = await http(url, { method, headers, body })
    const text = await response.body.text()
    console.log(outputBody(text))

    if (response.statusCode >= 400) process.exitCode = 1
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = curl
module.exports.requestUrl = requestUrl
module.exports.requestBody = requestBody
module.exports.outputBody = outputBody
