const { logger } = require('./../../shared/logger')

const conventions = require('./../../lib/helpers/conventions')
const escapeQuotes = require('./../../lib/helpers/escapeQuotes')

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
    let inline = ''

    switch (options.format) {
      case 'eval':
        for (const [key, value] of Object.entries(results)) {
          inline += `${key}=${escapeQuotes(value)}\n`
        }
        inline = inline.trim()
        console.log(inline)
        break
      case 'shell':
        for (const [key, value] of Object.entries(results)) {
          inline += `${key}=${value} `
        }
        inline = inline.trim()
        console.log(inline)
        break
      default: // json
        let space = 0
        if (options.prettyPrint) {
          space = 2
        }
        console.log(JSON.stringify(results, null, space))
        break
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
