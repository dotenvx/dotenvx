const transfer = require('../../lib/services/transfer')
const { logger } = require('../../shared/logger')
const armoredKeyDisplay = require('../../lib/helpers/armoredKeyDisplay')

module.exports = async function () {
  try {
    if (process.env.CI || !process.stdin.isTTY || !process.stderr.isTTY) throw new Error('Run [dotenvx transfer] in an interactive terminal')
    const envFile = this.opts().envFile || '.env'
    const result = await transfer(envFile)
    const display = armoredKeyDisplay(result.publicKey)
    if (result.changed) logger.success(`transferred ${envFile} to ${result.to} (${display})`)
    else logger.info(`no change to ${envFile} (${display})`)
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') return { exitCode: 130, error }
    logger.error(error.messageWithHelp || error.message)
    return { exitCode: 1, error }
  }
}
