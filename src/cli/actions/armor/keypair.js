const { logger } = require('../../../shared/logger')
const Session = require('./../../../db/session')
const ArmorKeypair = require('./../../../lib/services/armorKeypair')
const createSpinner = require('../../../lib/helpers/createSpinner')
const listenForOpenKey = require('../../../lib/helpers/listenForOpenKey')
const openUrl = require('../../../lib/helpers/openUrl')
const armoredKeyDisplay = require('../../../lib/helpers/armoredKeyDisplay')

function printKeypair (json, options) {
  const output = {
    public_key: json.public_key,
    private_key: json.private_key
  }

  const space = options.prettyPrint ? 2 : 0
  console.log(JSON.stringify(output, null, space))
}

async function keypair (publicKey) {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'retrieving' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (publicKey) {
    logger.debug(`publicKey: ${publicKey}`)
  }

  const sesh = new Session()
  await sesh.notifyUpdate()
  const hostname = options.hostname || sesh.hostname()
  const token = options.token || sesh.token()
  let cleanupOpenKeyListener = () => {}

  try {
    const devicePublicKey = sesh.devicePublicKey()
    const keypair = new ArmorKeypair(hostname, token, devicePublicKey, publicKey, {
      team: options.team,
      envFile: options.envFile,
      metadata: options.metadata
    })
    const keyDisplay = armoredKeyDisplay(publicKey)

    keypair.onApprovalRequired = ({ approvalUri, code }) => {
      if (spinner) {
        spinner.text = 'waiting for approval'
      }

      const keySuffix = keyDisplay ? ` (${keyDisplay})` : ''
      logger.info(`◌ [${code}] press Enter to open [${approvalUri}] and approve${keySuffix}`)
      cleanupOpenKeyListener = listenForOpenKey(() => openUrl(approvalUri))
    }

    const json = await keypair.run()

    cleanupOpenKeyListener()
    if (spinner) spinner.stop()
    printKeypair(json, options)
  } catch (error) {
    cleanupOpenKeyListener()
    if (spinner) spinner.stop()
    if (error.message) {
      logger.error(error.message)
    } else {
      logger.error(error)
    }
    if (error.stack) {
      logger.debug(error.stack)
    }
    process.exit(1)
  }
}

module.exports = keypair
