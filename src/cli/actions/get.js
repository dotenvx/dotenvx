const { logger } = require('./../../shared/logger')

const conventions = require('./../../lib/helpers/conventions')
const escape = require('./../../lib/helpers/escape')

const main = require('./../../lib/main')

function get (key) {
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let envs = []
  // handle shorthand conventions - like --convention=nextjs
  if (options.convention) {
    envs = conventions(options.convention).concat(this.envs)
  } else {
    envs = this.envs
  }

  const results = main.get(key, envs, options.overload, process.env.DOTENV_KEY, options.all)

  if (typeof results === 'object' && results !== null) {
    if (options.format === 'eval') {
      let inline = ''
      for (const [key, value] of Object.entries(results)) {
        inline += `${key}=${escape(value)}\n`
      }
      inline = inline.trim()

      console.log(inline)
    } else if (options.format === 'shell') {
      let inline = ''
      for (const [key, value] of Object.entries(results)) {
        inline += `${key}=${value} `
      }
      inline = inline.trim()

      console.log(inline)
    } else {
      let space = 0
      if (options.prettyPrint) {
        space = 2
      }

      console.log(JSON.stringify(results, null, space))
    }
  } else {
    if (results === undefined) {
      console.log('')
      process.exit(1)
    } else {
      console.log(results)
    }
  }
}

module.exports = get
