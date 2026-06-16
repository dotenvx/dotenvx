const path = require('path')
const childProcess = require('child_process')

const EXEC_TIMEOUT = 5 * 60 * 1000

function cliPath () {
  return path.resolve(__dirname, '../../../cli/dotenvx.js')
}

function execEnv () {
  const env = { ...process.env }
  env._TAPJS_PROCESSINFO_COVERAGE_ = '0'

  if (env.NODE_OPTIONS && env.NODE_OPTIONS.includes('@tapjs/processinfo')) {
    const nodeOptions = env.NODE_OPTIONS
      .split(/\s+/)
      .filter((option) => !option.includes('@tapjs/processinfo'))
      .join(' ')
      .trim()

    if (nodeOptions) {
      env.NODE_OPTIONS = nodeOptions
    } else {
      delete env.NODE_OPTIONS
    }
  }

  return env
}

function armorKeypairSync (_existingPublicKey, options = {}) {
  const args = [cliPath(), 'keypair', '--format', 'json']
  if (options.envFilepath) args.push('-f', options.envFilepath)

  let keypairs = {}
  try {
    keypairs = JSON.parse(childProcess.execFileSync(process.execPath, args, {
      env: execEnv(),
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
