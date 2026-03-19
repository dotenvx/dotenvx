const fsx = require('./../../lib/helpers/fsx')
const path = require('path')
const { logger } = require('./../../shared/logger')

const Rotate = require('./../../lib/services/rotate')

const catchAndLog = require('../../lib/helpers/catchAndLog')

function localDisplayPath (filepath) {
  if (!filepath) return '.env.keys'
  if (!path.isAbsolute(filepath)) return filepath

  const relative = path.relative(process.cwd(), filepath)
  return relative || path.basename(filepath)
}

function rotate () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const opsOn = options.opsOff !== true

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = new Rotate(envs, options.key, options.excludeKey, options.envKeysFile, opsOn).run()

    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
      if (processedEnv.privateKeyAdded) {
        console.log('')
        console.log(processedEnv.envKeysSrc)
      }
    }
    process.exit(0) // exit early
  } else {
    try {
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = new Rotate(envs, options.key, options.excludeKey, options.envKeysFile, opsOn).run()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`rotating ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          if (processedEnv.error.code === 'MISSING_ENV_FILE') {
            logger.warn(processedEnv.error.message)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.envFilepath}] and re-run [dotenvx rotate]`)
          } else {
            logger.warn(processedEnv.error.message)
            if (processedEnv.error.help) {
              logger.help(processedEnv.error.help)
            }
          }
        } else if (processedEnv.changed) {
          fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
          if (processedEnv.privateKeyAdded) {
            fsx.writeFileX(processedEnv.envKeysFilepath, processedEnv.envKeysSrc)
          }

          logger.verbose(`rotated ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no changes ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (changedFilepaths.length > 0) {
        const keyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.privateKeyAdded)
        let msg = `⟳ rotated (${changedFilepaths.join(',')})`
        if (keyAddedEnv) {
          const envKeysFilepath = localDisplayPath(keyAddedEnv.envKeysFilepath)
          msg += ` + key (${envKeysFilepath})`
        }
        logger.success(msg)
      } else if (unchangedFilepaths.length > 0) {
        logger.neutral(`○ no changes (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }
    } catch (error) {
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = rotate
