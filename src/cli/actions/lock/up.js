const lockedValue = require('../../../lib/helpers/lockedValue')

const { logger } = require('../../../shared/logger')
const LockUp = require('./../../../lib/services/lockUp')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')
const prompts = require('../../../lib/helpers/prompts')
const resolveLockPassword = require('../../../lib/helpers/resolveLockPassword')

async function up () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const lockUp = new LockUp(options.envFile, options.envKeysFile)

    const plan = lockUp.plan()
    let results = plan.alreadyLocked.map(lockedPrivateKey => ({
      changed: false,
      privateKeyName: lockedPrivateKey.privateKeyName,
      privateKeyValue: undefined,
      lockedPrivateKeyValue: lockedPrivateKey.lockedPrivateKeyValue,
      publicKeyValue: lockedPrivateKey.publicKeyValue,
      alreadyLocked: true
    }))

    if (plan.matches.length > 0) {
      const preset = resolveLockPassword(options)
      const passphrase = preset !== undefined
        ? preset
        : await prompts.password({
          message: 'passphrase',
          prefix: '⊡',
          separator: '='
        }, {
          input: process.stdin,
          output: process.stderr
        })

      results = lockUp.run((privateKey, publicKey) => lockedValue(privateKey, passphrase, publicKey)).results
    }

    for (const result of results) {
      const keyDisplay = armoredKeyDisplay(result.publicKeyValue) || result.privateKeyName

      if (result.changed) {
        logger.success(`⊡ locked (${keyDisplay})`)
      } else {
        logger.info(`○ no change (${keyDisplay})`)
      }
    }
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') {
      process.exit(130)
      return
    }

    logger.error(error.message)
    process.exit(1)
  }
}

module.exports = up
module.exports.lockedValue = lockedValue
