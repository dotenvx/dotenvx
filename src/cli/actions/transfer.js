const transfer = require('../../lib/services/transfer')
const { logger } = require('../../shared/logger')
const { injectsummary } = require('@dotenvx/primitives')

module.exports = async function () {
  try {
    if (process.env.CI || !process.stdin.isTTY || !process.stderr.isTTY) throw new Error('Run [dotenvx transfer] in an interactive terminal')
    const envFile = this.opts().envFile || '.env'
    const result = await transfer(envFile)
    const summary = injectsummary.sources([{
      filepath: 'private key',
      publicKeys: [result.publicKey],
      keyCustodies: [result.toId]
    }]).files[0]
    if (result.changed) logger.success(`⇄ transferred ${summary.replace(' via ', ' to ')}`)
    else logger.info(`○ no change to ${summary}`)
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') return { exitCode: 130, error }
    logger.error(error.messageWithHelp || error.message)
    return { exitCode: 1, error }
  }
}
