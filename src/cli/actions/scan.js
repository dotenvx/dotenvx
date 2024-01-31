const logger = require('./../../shared/logger')
const helpers = require('./../helpers')

function scan () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  logger.error('implement')
}

module.exports = scan
