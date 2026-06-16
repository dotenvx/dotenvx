const path = require('path')
const childProcess = require('child_process')

function serializeCommand (command) {
  if (Array.isArray(command)) return command.map((arg) => `${arg}`).join(' ')
  return `${command}`
}

function metadataFromOptions (options) {
  if (!options.command) return undefined

  return JSON.stringify({
    command: serializeCommand(options.command)
  })
}

function cliPath () {
  return path.resolve(__dirname, '../../../cli/dotenvx.js')
}

function armorKeypairSync (existingPublicKey, options = {}) {
  const args = [cliPath(), 'armor', 'keypair', '--no-spinner']
  if (options.token) args.push('--token', options.token)
  if (options.envFilepath) args.push('-f', options.envFilepath)

  const metadata = metadataFromOptions(options)
  if (metadata) args.push('--metadata', metadata)

  if (existingPublicKey) args.push(existingPublicKey)

  let kp = {}
  try {
    kp = JSON.parse(childProcess.execFileSync(process.execPath, args, {
      stdio: ['inherit', 'pipe', 'inherit']
    }).toString().trim())
  } catch (_error) {
    kp = {}
  }

  return {
    publicKey: kp.public_key,
    privateKey: kp.private_key
  }
}

module.exports = armorKeypairSync
