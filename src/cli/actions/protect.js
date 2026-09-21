const installProtectFilter = require('../../lib/helpers/installProtectFilter')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function protect () {
  if (this.opts().clean !== undefined) {
    return require('./protectClean')(this.opts().clean)
  }
  try {
    installProtectFilter()
    logger.success('⁑ protected (git add now rejects plaintext env files across your repositories on this machine)')
  } catch (error) {
    catchAndLog(error)
    process.exitCode = 1
  }
}
