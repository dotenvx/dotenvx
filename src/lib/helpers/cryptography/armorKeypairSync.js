const path = require('path')
const childProcess = require('child_process')

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

function cliPath () {
  return path.resolve(__dirname, '../../../cli/dotenvx.js')
}

function armorKeypairSync (existingPublicKey, options = {}) {
  const args = [cliPath(), 'keypair', '--no-spinner', '--format', 'json']
  if (options.hostname) args.push('--hostname', options.hostname)
  if (options.token) args.push('--token', options.token)
  if (options.team) args.push('--team', options.team)
  if (options.envFilepath) args.push('-f', options.envFilepath)
  if (existingPublicKey) args.push('--public-key', existingPublicKey)

  const metadata = metadataFromOptions(options)
  if (metadata) args.push('--metadata', metadata)

  let keypairs = {}
  try {
    keypairs = JSON.parse(childProcess.execFileSync(process.execPath, args, {
      stdio: ['inherit', 'pipe', 'inherit']
    }).toString().trim())
  } catch (_error) {
    keypairs = {}
  }

  const publicKeyName = Object.keys(keypairs).find((key) => key === 'DOTENV_PUBLIC_KEY' || key.startsWith('DOTENV_PUBLIC_KEY_'))
  const privateKeyName = Object.keys(keypairs).find((key) => key === 'DOTENV_PRIVATE_KEY' || key.startsWith('DOTENV_PRIVATE_KEY_'))

  return {
    publicKey: publicKeyName ? keypairs[publicKeyName] : undefined,
    privateKey: privateKeyName ? keypairs[privateKeyName] : undefined
  }
}

module.exports = armorKeypairSync
