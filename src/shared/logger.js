const Errors = require('../lib/helpers/errors')
const { getColor, bold } = require('./colors')

const levels = {
  error: 0,
  infoerror: 0,
  warn: 1,
  success: 2,
  info: 2,
  help: 2,
  verbose: 4,
  debug: 5,
  silly: 6
}

const error = (m, stream) => bold(getColor('red', stream)(`☠ ${m}`), stream)
const infoerror = (m, stream) => getColor('gray', stream)(m) // actually an error
const warn = (m, stream) => getColor('orangered', stream)(`⚠ ${m}`)
const success = (m, stream) => getColor('amber', stream)(m)
const info = (m, stream) => getColor('gray', stream)(m)
const help = (m, stream) => getColor('dodgerblue', stream)(m)
const verbose = (m, stream) => getColor('plum', stream)(`┆ ${m}`)
const debug = (m, stream) => getColor('plum', stream)(`┆ ${m}`)

let currentLevel = levels.info // default log level

function isLevelEnabled (level) {
  if (levels[level] === undefined) {
    throw new Errors({ level }).missingLogLevel()
  }
  return levels[level] <= currentLevel
}

function stderr (level, message) {
  if (isLevelEnabled(level)) {
    const formattedMessage = formatMessage(level, message, process.stderr)
    console.error(formattedMessage)
  }
}

function stdout (level, message) {
  if (isLevelEnabled(level)) {
    const formattedMessage = formatMessage(level, message, process.stdout)
    console.log(formattedMessage)
  }
}

function formatMessage (level, message, stream) {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
    // errors
    case 'error':
      return error(formattedMessage, stream)
    case 'infoerror':
      return infoerror(formattedMessage, stream)
    // warns
    case 'warn':
      return warn(formattedMessage, stream)
    // successes
    case 'success':
      return success(formattedMessage, stream)
    // info
    case 'info':
      return info(formattedMessage, stream)
    // help
    case 'help':
      return help(formattedMessage, stream)
    // verbose
    case 'verbose':
      return verbose(formattedMessage, stream)
    // debug
    case 'debug':
      return debug(formattedMessage, stream)
  }
}

const logger = {
  // track level
  level: 'info',

  // errors
  error: (msg) => stderr('error', msg),
  infoerror: (msg) => stderr('infoerror', msg),
  // warns
  warn: (msg) => stderr('warn', msg),
  // success
  success: (msg) => stderr('success', msg),
  // info
  info: (msg) => stdout('info', msg),
  // help
  help: (msg) => stderr('help', msg),
  // verbose
  verbose: (msg) => stderr('verbose', msg),
  // debug
  debug: (msg) => stderr('debug', msg),
  setLevel: (level) => {
    if (levels[level] !== undefined) {
      currentLevel = levels[level]
      logger.level = level
    }
  },
  setName: (name) => {
    logger.name = name
  },
  setVersion: (version) => {
    logger.version = version
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
    logger.debug(`setting log level to: ${logLevel}`)
  }
}

function setLogName (options) {
  const logName = options.logName
  if (!logName) return
  logger.setName(logName)
}

function setLogVersion (options) {
  const logVersion = options.logVersion
  if (!logVersion) return
  logger.setVersion(logVersion)
}

module.exports = {
  logger,
  getColor,
  setLogLevel,
  setLogName,
  setLogVersion,
  levels
}
