const { logger } = require('./../../shared/logger')

const conventions = require('./../../lib/helpers/conventions')

const main = require('./../../lib/main')

function get (key) {
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let envs = []
  // handle shorthand conventions - like --convention=nextjs
  if (options.convention) {
    envs = conventions(options.convention).concat(this.envs)
  } else {
    envs = this.envs
  }

  const value = main.get(key, envs, options.overload, process.env.DOTENV_KEY, options.all)

  if (typeof value === 'object' && value !== null) {
    if (options.prettyPrint) {
      logger.blank0(JSON.stringify(value, null, 2))
    } else {
      logger.blank0(value)
    }
  } else {
    if (value === undefined) {
      logger.blank0('')
      process.exit(1)
    } else {
      logger.blank0(value)
    }
  }
}

module.exports = get
