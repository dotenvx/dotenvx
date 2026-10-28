const { match } = require('@dotenvx/primitives')
const statusReporter = require('../../lib/helpers/statusReporter')
const { logger } = require('./../../shared/logger')

const escape = require('./../../lib/helpers/escape')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const getResolver = require('./../../lib/resolvers/get')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')
const mask = require('../../lib/helpers/mask')

function filter (parsed, includeKeys, excludeKeys) {
  const include = includeKeys && match(includeKeys)
  const exclude = excludeKeys && match(excludeKeys)

  return Object.fromEntries(Object.entries(parsed).filter(([key]) => {
    if (include && !include(key)) return false
    if (exclude && exclude(key)) return false

    return true
  }))
}

async function get (key) {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(this.opts()))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const prettyPrint = options.prettyPrint || options.pp
  const ignore = options.ignore || []
  let errorCount = 0

  const envs = this.envs

  try {
    const sesh = new Session()
    const noArmor = options.armor === false || (await sesh.noArmor())
    const noNative = options.native === false || options.noNative === true
    const { parsed, errors } = await getResolver({
      key,
      envs,
      convention: options.convention,
      overload: options.overload,
      all: options.all,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noNative,
      no1Password: options['1password'] === false || options.no1Password === true,
      noBitwarden: options.bitwarden === false || options.noBitwarden === true,
      onStatus: statusReporter(spinner)
    })
    const filtered = filter(parsed, options.includeKey, options.excludeKey)

    for (const error of errors || []) {
      if (ignore.includes(error.code)) {
        continue // ignore error
      }

      if (options.strict || error.strict) throw error

      errorCount += 1
      logger.error(error.messageWithHelp || error.message)
    }

    if (spinner) spinner.stop()
    if (options.mask !== undefined) {
      let showChar = options.mask
      if (options.mask === true) {
        showChar = 6
      }

      for (const key of Object.keys(filtered)) {
        filtered[key] = mask(filtered[key], showChar)
      }
    }

    if (key) {
      const single = filtered[key]
      if (single === undefined) {
        console.log('')
      } else {
        console.log(single)
      }
    } else {
      if (options.format === 'eval' || options.format === 'eval-export') {
        const prefix = options.format === 'eval-export' ? 'export ' : ''
        let inline = ''
        for (const [key, value] of Object.entries(filtered)) {
          inline += `${prefix}${key}=${escape(value)}\n`
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'shell') {
        let inline = ''
        for (const [key, value] of Object.entries(filtered)) {
          inline += `${key}=${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'colon') {
        let inline = ''
        for (const [key, value] of Object.entries(filtered)) {
          inline += `${key}:${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else {
        let space = 0
        if (prettyPrint) {
          space = 2
        }

        console.log(JSON.stringify(filtered, null, space))
      }
    }

    return { exitCode: errorCount > 0 ? 1 : 0, errorCount }
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.code === 'PROMPT_CANCELLED') {
      return { exitCode: 130, error }
    }
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = require('../../lib/events/cli')('get', get)
