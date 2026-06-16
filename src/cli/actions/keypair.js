const { logger } = require('./../../shared/logger')

const Keypair = require('./../../lib/services/keypair')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorOptions = require('./normalizeArmorOptions')

async function keypair (key) {
  const options = normalizeArmorOptions(this.opts())
  const spinner = await createSpinner({ ...options, text: 'retrieving' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const prettyPrint = options.prettyPrint || options.pp

  const sesh = new Session()
  const noArmor = options.armor === false || await sesh.noArmor()
  if (spinner) spinner.stop()
  const keypairs = await new Keypair(options.envFile, options.envKeysFile, noArmor, {
    command: process.argv.slice(2)
  }).run()
  const results = key ? keypairs[key] : keypairs

  if (spinner) spinner.stop()
  if (typeof results === 'object' && results !== null) {
    if (options.format === 'shell') {
      let inline = ''
      for (const [keyName, value] of Object.entries(results)) {
        inline += `${keyName}=${value || ''} `
      }
      inline = inline.trim()

      console.log(inline)
    } else if (options.format === 'colon') {
      let inline = ''
      for (const [keyName, value] of Object.entries(results)) {
        inline += `${keyName}:${value || ''} `
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
    } else if (options.format === 'colon' && key) {
      console.log(`${key}:${results}`)
    } else {
      console.log(results)
    }
  }
}

module.exports = keypair
