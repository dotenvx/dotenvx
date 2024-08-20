const winston = require('winston')
const colors = require('color-name')
const pc = require('picocolors')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./../lib/helpers/packageJson')

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
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

function getColor (color) {
  if (!Object.hasOwn(colors, color)) {
    throw new Error(`Invalid color ${color}`)
  }
  if (!pc.isColorSupported) return (message) => message
  const [r, g, b] = colors[color]
  return (message) => `\x1b[38;2;${r};${g};${b}m${message}\x1b[39m`
}

const error = (m) => pc.bold(pc.red(m))
const warn = getColor('orangered')
const success = getColor('green')
const successv = getColor('olive') // yellow-ish tint that 'looks' like dotenv
const help = getColor('blue')
const help2 = getColor('gray')
const http = getColor('green')
const verbose = getColor('plum')
const debug = getColor('plum')

const dotenvxFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
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
    case 'warn':
      return warn(formattedMessage)
    case 'warnv':
      return warn(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'warnvp':
      return warn(`[dotenvx@${packageJson.version}][precommit] ${formattedMessage}`)
    case 'warnvpb':
      return warn(`[dotenvx@${packageJson.version}][prebuild] ${formattedMessage}`)
    case 'success':
      return success(formattedMessage)
    case 'successv': // success with 'version'
      return successv(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'successvp': // success with 'version' and precommit
      return success(`[dotenvx@${packageJson.version}][precommit] ${formattedMessage}`)
    case 'successvpb': // success with 'version' and precommit
      return success(`[dotenvx@${packageJson.version}][prebuild] ${formattedMessage}`)
    case 'info':
      return formattedMessage
    case 'help':
      return help(formattedMessage)
    case 'help2':
      return help2(formattedMessage)
    case 'http':
      return http(formattedMessage)
    case 'verbose':
      return verbose(formattedMessage)
    case 'debug':
      return debug(formattedMessage)
    case 'blank': // custom
      return formattedMessage
  }
})

const logger = createLogger({
  level: 'info',
  levels,
  format: combine(
    dotenvxFormat
  ),
  transports: [
    new transports.Console()
  ]
})

const setLogLevel = options => {
  const logLevel = options.debug
    ? 'debug'
    : options.verbose
      ? 'verbose'
      : options.quiet
        ? 'error'
        : options.logLevel

  if (!logLevel) return
  logger.level = logLevel
  // Only log which level it's setting if it's not set to quiet mode
  if (!options.quiet || (options.quiet && logLevel !== 'error')) {
    logger.debug(`Setting log level to ${logLevel}`)
  }
}

module.exports = {
  logger,
  getColor,
  setLogLevel
}
