const path = require('path')
const childProcess = require('child_process')

// helpers
const guessPublicKeyName = require('./guessPublicKeyName')

// services
const Keypair = require('./../services/keypair')

function findPublicKey (envFilepath) {
  const publicKeyName = guessPublicKeyName(envFilepath)

  let publicKey
  try {
    // if installed as sibling module
    const projectRoot = path.resolve(process.cwd())
    const dotenvxProPath = require.resolve('@dotenvx/dotenvx-pro', { paths: [projectRoot] })
    const { keypair } = require(dotenvxProPath)
    publicKey = keypair(envFilepath, publicKeyName)
  } catch (_e) {
    try {
      // if installed as binary cli
      publicKey = childProcess.execSync(`dotenvx-pro keypair ${publicKeyName} -f ${envFilepath}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
    } catch (_e) {
      // fallback to local KeyPair - smart enough to handle process.env, .env.keys, etc
      publicKey = new Keypair(envFilepath, publicKeyName).run()
    }
  }

  return publicKey
}

module.exports = findPublicKey
