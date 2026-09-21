const installProtectFilter = require('../../lib/helpers/installProtectFilter')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function protect () {
  if (this.opts().gitFile !== undefined) {
    return require('./protectStdin')(this.opts().gitFile)
  }
  try {
    installProtectFilter()
    const { warning } = require('../../lib/helpers/uninstallPrecommitHook')()
    if (warning) logger.warn(warning)
    logger.success('⁑ protected (plaintext .env files now protected from being committed to code on this machine)')
  } catch (error) {
    catchAndLog(error)
    process.exitCode = 1
  }
}
