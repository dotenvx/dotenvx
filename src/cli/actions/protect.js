const installProtectFilter = require('../../lib/helpers/installProtectFilter')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function protect () {
  if (this.opts().gitFile !== undefined) {
    return require('./protectStdin')(this.opts().gitFile)
  }
  try {
    installProtectFilter()
    logger.success('⁑ protected (plaintext .env files are now protected from being committed to code)')
  } catch (error) {
    catchAndLog(error)
    process.exitCode = 1
  }
}
