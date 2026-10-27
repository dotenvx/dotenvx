const fsx = require('../../lib/helpers/fsx')
const primitives = require('@dotenvx/primitives')
const { logger } = require('../../shared/logger')
const get = require('../../lib/resolvers/get')
const Session = require('../../db/session')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')

module.exports = async function check () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(this.opts()))

  try {
    const policy = primitives.policy(fsx.readFileXSync('Dotenvxfile'))
    const session = new Session()
    const { parsed: finalEnv, errors: loadingErrors } = await get({
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
    const { errors: validationErrors } = primitives.check(policy, finalEnv)
    const errors = [...loadingErrors, ...validationErrors].filter(error => !(options.ignore || []).includes(error.code))

    for (const error of errors) logger.error(error.messageWithHelp || error.message)
    if (errors.length) return { exitCode: 1, errorCount: errors.length }

    logger.success('valid environment per Dotenvxfile')
    return { exitCode: 0, errorCount: 0 }
  } catch (error) {
    if (error.code === 'PROMPT_CANCELLED') return { exitCode: 130, error }
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
