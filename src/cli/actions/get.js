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
    let space = 0
    if (options.prettyPrint) {
      space = 2
    }

    process.stdout.write(JSON.stringify(value, null, space))
  } else {
    if (value === undefined) {
      process.stdout.write('')
      process.exit(1)
    } else {
      process.stdout.write(value)
    }
  }
}

module.exports = get
