const path = require('path')
const childProcess = require('child_process')

const EXEC_TIMEOUT = 5 * 60 * 1000

function cliPath () {
  return path.resolve(__dirname, '../../../cli/dotenvx.js')
}

function armorKeypairSync (_existingPublicKey, options = {}) {
  const args = [cliPath(), 'keypair', '--format', 'json']
  if (options.envFilepath) args.push('-f', options.envFilepath)

  let keypairs = {}
  try {
    keypairs = JSON.parse(childProcess.execFileSync(process.execPath, args, {
      stdio: ['inherit', 'pipe', 'inherit'],
      timeout: EXEC_TIMEOUT
    }).toString().trim())
  } catch (_error) {
    keypairs = {}
  }

  const publicKeyName = Object.keys(keypairs).find((key) => key === 'DOTENV_PUBLIC_KEY' || key.startsWith('DOTENV_PUBLIC_KEY_'))
  const privateKeyName = Object.keys(keypairs).find((key) => key === 'DOTENV_PRIVATE_KEY' || key.startsWith('DOTENV_PRIVATE_KEY_'))

  return {
    publicKey: keypairs[publicKeyName],
    privateKey: keypairs[privateKeyName]
  }
}

module.exports = armorKeypairSync
