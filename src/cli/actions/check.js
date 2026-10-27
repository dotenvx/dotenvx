const fsx = require('../../lib/helpers/fsx')
const primitives = require('@dotenvx/primitives')
const { logger } = require('../../shared/logger')
const getResolver = require('../../lib/resolvers/get')
const Session = require('../../db/session')
const Errors = require('../../lib/helpers/errors')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')

module.exports = async function check () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(this.opts()))

  try {
    const source = fsx.readFileXSync('Dotenvxfile')
    const session = new Session()
    const { parsed: finalEnv, errors: loadingErrors, processedEnvs } = await getResolver({
      envs: this.envs,
      all: true,
      convention: options.convention,
      overload: options.overload,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor: options.armor === false || (await session.noArmor()),
      noNative: options.native === false,
      no1Password: options['1password'] === false,
      noBitwarden: options.bitwarden === false
    })

    const files = processedEnvs.filter(row => row.type === 'envFile')
    const policy = primitives.policy(source, files.length ? files.map(row => row.filepath).join(',') : undefined)
    const errors = [...loadingErrors]
    for (const file of files) {
      if (file.src === undefined) continue
      const storagePolicy = primitives.storagepolicy(source, file.filepath)
      const { scanned } = primitives.scan(file.src)
      const values = Object.fromEntries(Object.entries(scanned)
        .filter(([key]) => !/^DOTENV_(?:PUBLIC|PRIVATE)_KEY/.test(key)))
      const { errors: storageErrors } = primitives.storagecheck(storagePolicy, values)
      if (storageErrors.length) {
        const error = new Errors({ message: `${file.filepath}: ${storageErrors.map(error => error.message).join('; ')}` }).invalidStorage()
        error.strict = storageErrors.some(error => error.strict)
        errors.push(error)
      }
    }

    const { errors: validationErrors } = primitives.check(policy, finalEnv)

    const ignore = options.ignore || []
    if (validationErrors.length) {
      const error = new Errors({ message: validationErrors.map(error => error.message).join('; ') }).invalidEnv()
      error.strict = validationErrors.some(error => error.strict)
      errors.push(error)
    }

    let errorCount = 0
    let exitCode = 0
    for (const error of errors) {
      if (ignore.includes(error.code)) continue
      errorCount++
      if (error.strict !== false) exitCode = 1
      logger.error(error.messageWithHelp || error.message)
    }
    if (errorCount) return { exitCode, errorCount }

    logger.success('◈ valid env per Dotenvxfile')
    return { exitCode: 0, errorCount: 0 }
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') return { exitCode: 130, error }
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
