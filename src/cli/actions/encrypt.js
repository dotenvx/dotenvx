const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Encrypt = require('./../../lib/services/encrypt')
const Ops = require('./../../lib/services/ops')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const isIgnoringDotenvKeys = require('../../lib/helpers/isIgnoringDotenvKeys')

function encrypt () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const opsOn = options.opsOff !== true

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, opsOn).run()

    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
    }
    process.exit(0) // exit early
  } else {
    try {
      let ops = null
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, opsOn).run()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          if (processedEnv.error.code === 'MISSING_ENV_FILE') {
            logger.warn(processedEnv.error.message)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.envFilepath}] and re-run [dotenvx encrypt]`)
          } else {
            logger.warn(processedEnv.error.message)
            if (processedEnv.error.help) {
              logger.help(processedEnv.error.help)
            }
          }
        } else if (processedEnv.changed) {
          fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no changes ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (changedFilepaths.length > 0) {
        logger.success(`✔ encrypted (${changedFilepaths.join(',')})`)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`no changes (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }

      for (const processedEnv of processedEnvs) {
        if (processedEnv.privateKeyAdded) {
          if (opsOn) {
            try {
              ops = ops || new Ops()
              ops.keypair({
                envFilepath: processedEnv.envFilepath,
                envKeysFilepath: processedEnv.envKeysFilepath,
                privateKeyName: processedEnv.privateKeyName,
                privateKey: processedEnv.privateKey
              })
            } catch (e) {
              // noop
            }
          }

          // Ops hook point (first-time key created for this env file):
          // gate with `opsOn` and an Ops-installed check before calling your
          // Ops service (for example: backup/register processedEnv.privateKey).
          logger.success(`✔ key added to .env.keys (${processedEnv.privateKeyName})`)
          // logger.help('⮕  optional: [dotenvx ops backup] to securely backup private key')

          if (!isIgnoringDotenvKeys()) {
            logger.help('⮕  next run: [dotenvx ext gitignore --pattern .env.keys] to gitignore .env.keys')
          }

          logger.help(`⮕  next run: [${processedEnv.privateKeyName}='${processedEnv.privateKey}' dotenvx run -- yourcommand] to test decryption locally`)
        }
      }
    } catch (error) {
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = encrypt
