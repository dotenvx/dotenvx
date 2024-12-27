const packageJson = require('../lib/helpers/packageJson')
const { getColor, bold } = require('./colors')

const levels = {
  error: 0,
  errorv: 0,
  errornocolor: 0,
  warn: 1,
  success: 2,
  successv: 2,
  info: 2,
  help: 2,
  blank: 2,
  verbose: 4,
  debug: 5,
  silly: 6
}

const error = (m) => bold(getColor('red')(m))
const warn = getColor('orangered')
const success = getColor('green')
const successv = getColor('olive') // yellow-ish tint that 'looks' like dotenv
const help = getColor('dodgerblue')
const verbose = getColor('plum')
const debug = getColor('plum')

let currentLevel = levels.info // default log level

function log (level, message) {
  if (levels[level] === undefined) {
    throw new Error(`MISSING_LOG_LEVEL: '${level}'. implement in logger.`)
  }

  if (levels[level] <= currentLevel) {
    const formattedMessage = formatMessage(level, message)
    console.log(formattedMessage)
  }
}

function formatMessage (level, message) {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
    // errors
    case 'error':
      return error(formattedMessage)
    case 'errorv':
      return error(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'errornocolor':
      return formattedMessage
    // warns
    case 'warn':
      return warn(formattedMessage)
    // successes
    case 'success':
      return success(formattedMessage)
    case 'successv': // success with 'version'
      return successv(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    // info
    case 'info':
      return formattedMessage
    // help
    case 'help':
      return help(formattedMessage)
    // verbose
    case 'verbose':
      return verbose(formattedMessage)
    // debug
    case 'debug':
      return debug(formattedMessage)
    // blank
    case 'blank': // custom
      return formattedMessage
  }
}

const logger = {
  // track level
  level: 'info',

  // errors
  error: (msg) => log('error', msg),
  errorv: (msg) => log('errorv', msg),
  errornocolor: (msg) => log('errornocolor', msg),
  // warns
  warn: (msg) => log('warn', msg),
  // success
  success: (msg) => log('success', msg),
  successv: (msg) => log('successv', msg),
  // info
  info: (msg) => log('info', msg),
  // help
  help: (msg) => log('help', msg),
  // verbose
  verbose: (msg) => log('verbose', msg),
  // debug
  debug: (msg) => log('debug', msg),
  // blank
  blank: (msg) => log('blank', msg),
  setLevel: (level) => {
    if (levels[level] !== undefined) {
      currentLevel = levels[level]
      logger.level = level
    }
  }
}

function setLogLevel (options) {
  const logLevel = options.debug
    ? 'debug'
    : options.verbose
      ? 'verbose'
      : options.quiet
        ? 'error'
        : options.logLevel

  if (!logLevel) return
  logger.setLevel(logLevel)
  // Only log which level it's setting if it's not set to quiet mode
  if (!options.quiet || (options.quiet && logLevel !== 'error')) {
    logger.debug(`Setting log level to ${logLevel}`)
  }
}

module.exports = {
  logger,
  getColor,
  setLogLevel,
  levels
}
