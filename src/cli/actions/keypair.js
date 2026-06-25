const { logger } = require('./../../shared/logger')

const Keypair = require('./../../lib/services/keypair')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')

async function keypair (key) {
  const options = normalizeArmorAliases(this.opts())
  const spinner = await createSpinner({ ...options, text: 'retrieving' })
  let spinnerStopped = false

  function stopSpinner () {
    if (spinner && !spinnerStopped) {
      spinner.stop()
      spinnerStopped = true
    }
  }

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const prettyPrint = options.prettyPrint || options.pp

  try {
    const sesh = new Session()
    const noArmor = options.armor === false || await sesh.noArmor()
    const keypairs = await new Keypair({
      envFile: options.envFile,
      envKeysFilepath: options.envKeysFile,
      noArmor,
      command: process.argv.slice(2),
      onStatus: (text) => {
        if (spinner && text) {
          spinner.text = text
        }
      }
    }).run()
    const results = key ? keypairs[key] : keypairs

    stopSpinner()
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
  } catch (error) {
    stopSpinner()
    catchAndLog(error)
    process.exit(1)
  } finally {
    stopSpinner()
  }
}

module.exports = keypair
