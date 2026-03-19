const packageJson = require('../lib/helpers/packageJson')
const { getColor, bold } = require('./colors')

/**
 * Valid log level names as a string enum
 * @typedef {"error" | "warn" |  "success" |  "successv" |  "info" |  "help" |  "verbose" |  "debug" |  "silly"} LogLevelName
 */

/**
 * Valid log level numeric values
 * @typedef {0 | 1 | 2 | 4 | 5 | 6} LogLevelNumeric
 */

/**
 * Map of log level names to numeric values
 * @typedef {{[S in LogLevelName]: LogLevelNumeric}} LogLevelMap
 */

/** @type {LogLevelMap} */
const levels = {
  error: 0,
  warn: 1,
  success: 2,
  successv: 2,
  info: 2,
  help: 2,
  verbose: 4,
  debug: 5,
  silly: 6
}

/**
 * Generic form of a logging function
 * @typedef {function(string, ...any): void} LogFunction
 */

/**
 * A type of object that provides log functions for each log level
 * @typedef {{[S in LogLevelName]: LogFunction}} LoggerObject
 */

/**
 * Generic form of a string formatting function
 * @typedef {function(string, ...any): void} StringFormatFunction
 */

/** @type {StringFormatFunction} */
const error = (m) => bold(getColor('red')(m))
/** @type {StringFormatFunction} */
const warn = getColor('orangered')
/** @type {StringFormatFunction} */
const success = getColor('green')
/** @type {StringFormatFunction} */
const successv = getColor('olive') // yellow-ish tint that 'looks' like dotenv
/** @type {StringFormatFunction} */
const help = getColor('dodgerblue')
/** @type {StringFormatFunction} */
const verbose = getColor('plum')
/** @type {StringFormatFunction} */
const debug = getColor('plum')

let currentLevel = levels.info // default log level
let currentName = 'dotenvx' // default logger name
let currentVersion = packageJson.version // default logger version

function stderr (level, message, ...otherArgs) {
  const formattedMessage = formatMessage(level, message)
  console.error(formattedMessage, ...otherArgs)
}

function stdout (level, message, ...otherArgs) {
  if (levels[level] === undefined) {
    throw new Error(`MISSING_LOG_LEVEL: '${level}'. implement in logger.`)
  }

  if (levels[level] <= currentLevel) {
    const formattedMessage = formatMessage(level, message)
    console.log(formattedMessage, ...otherArgs)
  }
}

function formatMessage (level, message) {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
    // errors
    case 'error':
      return error(formattedMessage)
    // warns
    case 'warn':
      return warn(formattedMessage)
    // successes
    case 'success':
      return success(formattedMessage)
    case 'successv': // success with 'version'
      return successv(`[${currentName}@${currentVersion}] ${formattedMessage}`)
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
  }
}

/**
 * A logger object type
 * @typedef {Object} LoggerFunctions
 * @property {LogLevelName} level - current log level
 * @property {function(LogLevelName): void} setLevel - set logger level
 * @property {function(string): void} setName - set logger name
 * @property {function(string): void} setVersion - set logger version
 */

/**
 * A logger object
 * @typedef {LoggerFunctions & LoggerObject} Logger
 */

/**
 * @type {Logger}
 */
const logger = {
  // track level
  level: 'info',

  // errors
  error: (msg, ...otherArgs) => stderr('error', msg, ...otherArgs),
  // warns
  warn: (msg, ...otherArgs) => stdout('warn', msg, ...otherArgs),
  // success
  success: (msg, ...otherArgs) => stdout('success', msg, ...otherArgs),
  successv: (msg, ...otherArgs) => stdout('successv', msg, ...otherArgs),
  // info
  info: (msg, ...otherArgs) => stdout('info', msg, ...otherArgs),
  // help
  help: (msg, ...otherArgs) => stdout('help', msg, ...otherArgs),
  // verbose
  verbose: (msg, ...otherArgs) => stdout('verbose', msg, ...otherArgs),
  // debug
  debug: (msg, ...otherArgs) => stdout('debug', msg, ...otherArgs),
  silly: (msg, ...otherArgs) => stdout('silly', msg, ...otherArgs),
  setLevel: (level) => {
    if (levels[level] !== undefined) {
      currentLevel = levels[level]
      logger.level = level
    }
  },
  setName: (name) => {
    currentName = name
    logger.name = name
  },
  setVersion: (version) => {
    currentVersion = version
    logger.version = version
  }
}

/**
 * An options object specifying a log level
 * @typedef {Object} LogLevelOptionsParameter
 * @property {boolean} [debug]
 * @property {boolean} [verbose]
 * @property {boolean} [quiet]
 * @property {LogLevelName} [logLevel]
 */

/**
 * Sets the log level from an options object
 * @param {LogLevelOptionsParameter} options
 * @returns {void}
 */
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

/**
 * Sets the logger name from an options object
 * @param {Object} options
 * @property {string} [logName] - the name to set
 * @returns {void}
 */
function setLogName (options) {
  const logName = options.logName
  if (!logName) return
  logger.setName(logName)
}

/**
 * Sets the logger version from an options object
 * @param {Object} options
 * @property {any} [logVersion] - the version to set
 * @returns {void}
 */
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
