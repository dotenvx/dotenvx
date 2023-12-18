const winston = require('winston')
const chalk = require('chalk')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./packageJson')

const levels = {
  error: 0,
  warn: 1,
  success: 2,
  successv: 2,
  info: 2,
  blank: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

const error = chalk.bold.red
const warn = chalk.keyword('orange')
const http = chalk.keyword('green')
const success = chalk.keyword('olive') // yellow-ish tint that 'looks' like dotenv
const verbose = chalk.keyword('magenta')
const debug = chalk.keyword('magenta')

const dotenvxFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  switch (level.toLowerCase()) {
    case 'error':
      return error(formattedMessage)
    case 'warn':
      return warn(formattedMessage)
    case 'success':
      return success(formattedMessage)
    case 'successv': // success with 'version'
      return success(`[dotenvx@${packageJson.version}] ${formattedMessage}`)
    case 'info':
      return formattedMessage
    case 'http':
      return http(formattedMessage)
    case 'verbose':
      return verbose(formattedMessage)
    case 'debug':
      return debug(formattedMessage)
    case 'blank': // custom
      return formattedMessage
    default: // handle uncaught
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
