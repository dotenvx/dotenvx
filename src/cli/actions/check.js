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
    const policy = primitives.policy(fsx.readFileXSync('Dotenvxfile'))
    const session = new Session()
    const { parsed: finalEnv, errors: loadingErrors } = await getResolver({
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

    const { checked, errors: validationErrors } = primitives.check(policy, finalEnv)

    for (const [key, value] of Object.entries(checked)) {
      if (/^DOTENV_(?:PUBLIC|PRIVATE)_KEY/.test(key)) continue
      const failures = validationErrors.filter(error => error.key === key)
      const declared = Object.hasOwn(policy.keys, key)
      const status = [declared ? '' : '!declared', ...failures.map(error => `!${error.rule}`)].filter(Boolean).join(', ')
      logger.verbose(`${failures.length ? '☠' : declared ? '✔' : '⚠'} ${key}=${JSON.stringify(value)}${status ? ` # ${status}` : ''}`)
    }
    const ignore = options.ignore || []
    const errors = [...loadingErrors]
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
