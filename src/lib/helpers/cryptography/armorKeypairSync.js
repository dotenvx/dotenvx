const path = require('path')
const childProcess = require('child_process')

function cliPath () {
  return path.resolve(__dirname, '../../../cli/dotenvx.js')
}

function armorKeypairSync (_existingPublicKey, options = {}) {
  const args = [cliPath(), 'keypair', '--format', 'json']
  if (options.envFilepath) args.push('-f', options.envFilepath)

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
