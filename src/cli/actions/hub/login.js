const open = require('open')
const axios = require('axios')
const qrcode = require('qrcode-terminal')
const { confirm } = require('@inquirer/prompts')

const logger = require('./../../../shared/logger')
const helpers = require('./../../helpers')

async function login() {
  const options = this.opts()
  logger.debug('configuring options')
  logger.debug(options)

  const hostname = options.hostname

  logger.info('logging in...')

  try {
    const response = await axios.post(`${hostname}/oauth/device/code`, {})
    const { device_code, user_code, verification_uri, verification_uri_complete, expires_in, interval } = response.data

    logger.info(`next:`)
    logger.info('')
    logger.info(`  1. copy: ${helpers.formatCode(user_code)}`)
    logger.info(`  2. visit: ${verification_uri}`)
    logger.info(`  3. paste: ${helpers.formatCode(user_code)}`)
    qrcode.generate(verification_uri, {small: true})
    const answer = await confirm({ message: `press Enter to open ${verification_uri} in your browser...` })
    if (answer) {
      await open(verification_uri)
    }
  } catch (error) {
    logger.error(error)
  }
}

module.exports = login
