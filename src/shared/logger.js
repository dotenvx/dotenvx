const winston = require('winston')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./packageJson')

const dotenvFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  return `[dotenv@${packageJson.version}][${level.toUpperCase()}] ${formattedMessage}`
})

const logger = createLogger({
  level: 'info',
  format: combine(
    dotenvFormat
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = logger
