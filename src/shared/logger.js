const winston = require('winston')
const chalk = require('chalk')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./../lib/helpers/packageJson')

const levels = {
  blank0: 0,
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

const error = chalk.bold.red
const warn = chalk.keyword('orangered')
const success = chalk.keyword('green')
const successv = chalk.keyword('olive') // yellow-ish tint that 'looks' like dotenv
const help = chalk.keyword('blue')
const help2 = chalk.keyword('gray')
const http = chalk.keyword('green')
const verbose = chalk.keyword('plum')
const debug = chalk.keyword('plum')

const dotenvxFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
    case 'blank0': // special blank that always displays - even with quiet flag (for use with get action)
      return formattedMessage
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

module.exports = logger
