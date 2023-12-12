const winston = require('winston')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./packageJson')

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  blank: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

const dotenvxFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  if (level === 'blank') {
    return formattedMessage
  } else {
    return `[dotenvx@${packageJson.version}][${level.toLowerCase()}] ${formattedMessage}`
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
