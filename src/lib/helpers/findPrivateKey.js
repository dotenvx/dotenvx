const path = require('path')
const childProcess = require('child_process')

// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath) {
  const privateKeyName = guessPrivateKeyName(envFilepath)

  let privateKey
  try {
    // if installed as sibling module
    const projectRoot = path.resolve(process.cwd())
    const dotenvxProPath = require.resolve('@dotenvx/dotenvx-pro', { paths: [projectRoot] })
    const { keypair } = require(dotenvxProPath)
    privateKey = keypair(envFilepath, privateKeyName)
  } catch (_e) {
    try {
      // if installed as binary cli
      privateKey = childProcess.execSync(`dotenvx-pro keypair ${privateKeyName} -f ${envFilepath}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
    } catch (_e) {
      // fallback to local KeyPair - smart enough to handle process.env, .env.keys, etc
      privateKey = new Keypair(envFilepath, privateKeyName).run()
    }
  }

  return privateKey
}

module.exports = findPrivateKey
