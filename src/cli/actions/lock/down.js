const unlockedValue = require('../../../lib/helpers/unlockedValue')

const { logger } = require('../../../shared/logger')
const LockDown = require('./../../../lib/services/lockDown')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')
const prompts = require('../../../lib/helpers/prompts')
const resolveLockPassword = require('../../../lib/helpers/resolveLockPassword')

async function down () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const lockDown = new LockDown(options.envFile, options.envKeysFile)
    const plan = lockDown.plan()
    let results = plan.alreadyUnlocked

    if (plan.locked.length > 0) {
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

      results = lockDown.run(lockedPrivateKey => unlockedValue(lockedPrivateKey, passphrase)).results
    }

    for (const result of results) {
      const keyDisplay = armoredKeyDisplay(result.publicKeyValue) || result.privateKeyName

      if (result.changed) {
        logger.success(`⊡ unlocked (${keyDisplay})`)
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

module.exports = down
module.exports.unlockedValue = unlockedValue
