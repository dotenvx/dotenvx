const { logger } = require('./../../shared/logger')

const escape = require('./../../lib/helpers/escape')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const getResolver = require('./../../lib/resolvers/get')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const normalizeDotenvConfigPath = require('../../lib/helpers/normalizeDotenvConfigPath')
const buildCommandEnvs = require('../../lib/helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')
const mask = require('../../lib/helpers/mask')
const filterKeys = require('../../lib/helpers/filterKeys')

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

  const envs = buildCommandEnvs(normalizeDotenvConfigPath(this.envs), options.convention)

  try {
    const sesh = new Session()
    const noArmor = options.armor === false || (await sesh.noArmor())
    const noKeychain = options.native === false || options.noNative === true
    const { parsed: resolved, errors } = await getResolver({
      key,
      envs,
      overload: options.overload,
      all: options.all,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noKeychain,
      no1Password: options['1password'] === false || options.no1Password === true,
      noBitwarden: options.bitwarden === false || options.noBitwarden === true,
      onStatus: (text) => {
        if (spinner && text) {
          spinner.text = text
        }
      }
    })
    const parsed = filterKeys(resolved, options.includeKey, options.excludeKey)

    for (const error of errors || []) {
      if (options.strict) throw error // throw immediately if strict

      if (ignore.includes(error.code)) {
        continue // ignore error
      }

      errorCount += 1
      logger.error(error.messageWithHelp || error.message)
    }

    if (spinner) spinner.stop()
    if (options.mask !== undefined) {
      let showChar = options.mask
      if (options.mask === true) {
        showChar = 6
      }

      for (const key of Object.keys(parsed)) {
        parsed[key] = mask(parsed[key], showChar)
      }
    }

    if (key) {
      const single = parsed[key]
      if (single === undefined) {
        console.log('')
      } else {
        console.log(single)
      }
    } else {
      if (options.format === 'eval' || options.format === 'eval-export') {
        const prefix = options.format === 'eval-export' ? 'export ' : ''
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${prefix}${key}=${escape(value)}\n`
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'shell') {
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${key}=${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'colon') {
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${key}:${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else {
        let space = 0
        if (prettyPrint) {
          space = 2
        }

        console.log(JSON.stringify(parsed, null, space))
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.code === 'PROMPT_CANCELLED') {
      process.exit(130)
      return
    }
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = get
