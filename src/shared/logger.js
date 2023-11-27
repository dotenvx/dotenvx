const winston = require('winston')

const printf = winston.format.printf
const combine = winston.format.combine
const createLogger = winston.createLogger
const transports = winston.transports

const packageJson = require('./packageJson')

function pad (word) {
  return word.padEnd(9, ' ')
}

const dotenvxFormat = printf(({ level, message, label, timestamp }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message

  return `[dotenvx@${packageJson.version}]${pad(`[${level.toUpperCase()}]`)} ${formattedMessage}`
})

const logger = createLogger({
  level: 'info',
  format: combine(
    dotenvxFormat
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = logger
