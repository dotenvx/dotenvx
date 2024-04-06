const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function get (key) {
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.get(key, this.envs, options.overload, process.env.DOTENV_KEY, options.all)

  if (typeof value === 'object' && value !== null) {
    if (options.prettyPrint) {
      logger.blank0(JSON.stringify(value, null, 2))
    } else {
      logger.blank0(value)
    }
  } else {
    logger.blank0(value)
  }
}

module.exports = get
