const Session = require('../../../db/session')
const ArmorKeypair = require('../../services/armorKeypair')

function serializeCommand (command) {
  if (Array.isArray(command)) return command.map((arg) => `${arg}`).join(' ')
  return `${command}`
}

function metadataFromOptions (options) {
  if (options.metadata) return options.metadata
  if (!options.command) return undefined

  return JSON.stringify({
    command: serializeCommand(options.command)
  })
}

async function armorKeypair (existingPublicKey, options = {}) {
  const sesh = new Session()
  const token = options.token || sesh.token()
  if (!token) {
    return {
      publicKey: undefined,
      privateKey: undefined
    }
  }

  const json = await new ArmorKeypair(
    options.hostname || sesh.hostname(),
    token,
    sesh.devicePublicKey(),
    existingPublicKey,
    {
      envFile: options.envFilepath,
      team: options.team,
      metadata: metadataFromOptions(options)
    }
  ).run()

  return {
    publicKey: json.public_key,
    privateKey: json.private_key
  }
}

module.exports = armorKeypair
