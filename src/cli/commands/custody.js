function configureCustodyCommand (command, name, providerPath) {
  command.hook('preAction', async () => {
    const Session = require('../../db/session')
    await new Session().notifyUpdate()
  })
  command.description(`move private keys in/out of ${name}`).action(function () { this.help() })
  const descriptions = {
    up: `move key from .env.keys into ${name}`,
    down: `move key from ${name} to .env.keys`,
    push: `copy key from .env.keys into ${name}`,
    pull: `copy key from ${name} into .env.keys`
  }
  for (const [operation, description] of Object.entries(descriptions)) {
    command.command(operation)
      .description(description)
      .option('-f, --env-file <path>', 'path to your env file')
      .option('-fk, --env-keys-file <path>', 'path to your .env.keys file', '.env.keys')
      .action(async function () {
        const { logger } = require('../../shared/logger')
        const createSpinner = require('../../lib/helpers/createSpinner')
        const armoredKeyDisplay = require('../../lib/helpers/armoredKeyDisplay')
        const transfer = require('../../lib/services/custodyTransfer')
        const options = this.opts()
        const spinner = await createSpinner({ ...this.optsWithGlobals(), text: `${operation === 'up' || operation === 'push' ? 'storing in' : 'reading from'} ${name}` })
        try {
          const result = await transfer(require(providerPath), name, operation, options.envFile, options.envKeysFile)
          if (spinner) spinner.stop()
          const display = armoredKeyDisplay(result.publicKeyValue) || result.privateKeyName
          const messages = { up: `stored in ${name}`, down: `moved to ${options.envKeysFile}`, push: `pushed to ${name}`, pull: `pulled to ${options.envKeysFile}` }
          if (result.changed) logger.success(`□ ${messages[operation]} (${display})`)
          else logger.info(`○ no change (${display})`)
        } catch (error) {
          if (spinner) spinner.stop()
          if (error.code === 'PROMPT_CANCELLED') return process.exit(130)
          logger.error(error.message)
          process.exit(1)
        }
      })
  }
  return command
}

module.exports = configureCustodyCommand
