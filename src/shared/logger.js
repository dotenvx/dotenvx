const packageJson = require('../lib/helpers/packageJson')
const { getColor, bold } = require('./colors')

const levels = {
  error: 0,
  errorv: 0,
  errorvp: 0,
  errorvpb: 0,
  errornocolor: 0,
  warn: 1,
  warnv: 1,
  warnvp: 1,
  warnvpb: 1,
  success: 2,
  successv: 2,
  successvp: 2,
  successvpb: 2,
  info: 2,
  help: 2,
  help2: 2,
  blank: 2,
  verbose: 4,
  debug: 5,
  silly: 6
}

const error = (m) => bold(getColor('red')(m))
const warn = getColor('orangered')
const success = getColor('green')
const successv = getColor('olive') // yellow-ish tint that 'looks' like dotenv
const help = getColor('blue')
const help2 = getColor('gray')
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
    case 'errorvp':
      return error(`[dotenvx@${packageJson.version}][precommit] ${formattedMessage}`)
    case 'errorvpb':
      return error(`[dotenvx@${packageJson.version}][prebuild] ${formattedMessage}`)
    case 'errornocolor':
      return formattedMessage
    // warns
    case 'warn':
      return warn(formattedMessage)
    case 'warnv':
      return warn(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'warnvp':
      return warn(`[dotenvx@${packageJson.version}][precommit] ${formattedMessage}`)
    case 'warnvpb':
      return warn(`[dotenvx@${packageJson.version}][prebuild] ${formattedMessage}`)
    // successes
    case 'success':
      return success(formattedMessage)
    case 'successv': // success with 'version'
      return successv(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'successvp': // success with 'version' and precommit
      return success(`[dotenvx@${packageJson.version}][precommit] ${formattedMessage}`)
    case 'successvpb': // success with 'version' and precommit
      return success(`[dotenvx@${packageJson.version}][prebuild] ${formattedMessage}`)
    // info
    case 'info':
      return formattedMessage
    // help
    case 'help':
      return help(formattedMessage)
    case 'help2':
      return help2(formattedMessage)
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
  errorvp: (msg) => log('errorvp', msg),
  errorvpb: (msg) => log('errorvpb', msg),
  errornocolor: (msg) => log('errornocolor', msg),
  // warns
  warn: (msg) => log('warn', msg),
  warnv: (msg) => log('warnv', msg),
  warnvp: (msg) => log('warnvp', msg),
  warnvpb: (msg) => log('warnvpb', msg),
  // success
  success: (msg) => log('success', msg),
  successv: (msg) => log('successv', msg),
  successvp: (msg) => log('successvp', msg),
  successvpb: (msg) => log('successvpb', msg),
  // info
  info: (msg) => log('info', msg),
  // help
  help: (msg) => log('help', msg),
  help2: (msg) => log('help2', msg),
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
