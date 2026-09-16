const { derive } = require('@dotenvx/primitives')
const lockedValue = require('../helpers/lockedValue')
const unlockedValue = require('../helpers/unlockedValue')
const prompts = require('../helpers/prompts')
const createSpinner = require('../helpers/createSpinner')
const matchesKey = require('../helpers/matchesStoredKey')
const Errors = require('../helpers/errors')

// Context is shared only within a transform; never cache passphrases globally
// by filename or return them alongside the staged keys.
const passphrases = new WeakMap()

async function promptPassphrase () {
  createSpinner.pause()
  try {
    const passphrase = await prompts.password({ message: 'passphrase', prefix: '⊡', separator: '=' }, {
      input: process.stdin,
      output: process.stderr
    })
    if (!passphrase) throw new Error('passphrase must not be empty')
    return passphrase
  } finally {
    createSpinner.resume()
  }
}

async function lock (publicKey, privateKey, context) {
  if (derive(privateKey) !== publicKey) throw new Error('private key does not match the .env public key')
  if (!passphrases.has(context)) passphrases.set(context, promptPassphrase())
  return lockedValue(privateKey, await passphrases.get(context), publicKey)
}

function isLocked (value) {
  return typeof value === 'string' && value.startsWith('locked:')
}

async function unlock (publicKey, ring) {
  const value = ring && ring[publicKey]
  if (!isLocked(value)) return ring
  if (!matchesKey(publicKey, value)) throw new Error('invalid locked private key')
  if (!process.stdin.isTTY || !process.stderr.isTTY || process.env.CI) {
    throw Object.assign(new Error('locked private key requires an interactive passphrase prompt'), { code: 'LOCKED_PRIVATE_KEY' })
  }
  const passphrase = await promptPassphrase()
  let privateKey
  try {
    privateKey = unlockedValue(value, passphrase)
    if (derive(privateKey) !== publicKey) throw new Error('key mismatch')
  } catch {
    throw new Errors().invalidPassphrase()
  }
  return { ...ring, [publicKey]: privateKey }
}

function unlockSync (publicKey, ring) {
  if (isLocked(ring && ring[publicKey])) {
    throw Object.assign(new Error('locked private key requires an interactive async command; synchronous reads cannot prompt'), { code: 'LOCKED_PRIVATE_KEY' })
  }
  return ring
}

module.exports = { lock, unlock, unlockSync }
