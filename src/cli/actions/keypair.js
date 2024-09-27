const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')

function keypair (key) {
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const results = main.keypair(options.envFile, key)

  if (typeof results === 'object' && results !== null) {
    let space = 0
    if (options.prettyPrint) {
      space = 2
    }

    console.log(JSON.stringify(results, null, space))
  } else {
    if (results === undefined) {
      console.log('')
      process.exit(1)
    } else {
      console.log(results)
    }
  }
}

module.exports = keypair
