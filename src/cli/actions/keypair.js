const { logger } = require('./../../shared/logger')

const Keypair = require('./../../lib/services/keypair')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')

async function keypair (key) {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'retrieving' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const prettyPrint = options.prettyPrint || options.pp

  const sesh = new Session()
  const noOps = options.ops === false || await sesh.noOps()
  const keypairs = await new Keypair(options.envFile, options.envKeysFile, noOps).run()
  const results = key ? keypairs[key] : keypairs

  if (spinner) spinner.stop()
  if (typeof results === 'object' && results !== null) {
    // inline shell format - env $(dotenvx keypair --format=shell) your-command
    if (options.format === 'shell') {
      let inline = ''
      for (const [key, value] of Object.entries(results)) {
        inline += `${key}=${value || ''} `
      }
      inline = inline.trim()

      console.log(inline)
    // json format
    } else {
      let space = 0
      if (prettyPrint) {
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

module.exports = keypair
