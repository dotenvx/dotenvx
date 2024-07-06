const { logger } = require('./../../../shared/logger')

const main = require('./../../../lib/main')

function settings (key = null) {
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.settings(key)

  if (typeof value === 'object' && value !== null) {
    let space = 0
    if (options.prettyPrint) {
      space = 2
    }

    process.stdout.write(JSON.stringify(value, null, space))
  } else {
    process.stdout.write(value)
  }
}

module.exports = settings
