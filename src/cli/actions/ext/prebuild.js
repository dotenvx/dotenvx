const { logger } = require('../../../shared/logger')
const protectDocker = require('../protectDocker')

module.exports = function prebuild (directory) {
  logger.warn('[DEPRECATED] dotenvx prebuild. fix: run [dotenvx protect --docker]')
  return protectDocker.call(this, directory)
}
