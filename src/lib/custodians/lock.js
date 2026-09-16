const { derive } = require('@dotenvx/primitives')
const lockedValue = require('../helpers/lockedValue')
const unlockedValue = require('../helpers/unlockedValue')
const prompts = require('../helpers/prompts')
const createSpinner = require('../helpers/createSpinner')
const matchesKey = require('../helpers/matchesStoredKey')
const Errors = require('../helpers/errors')
const resolveLockPassword = require('../helpers/resolveLockPassword')

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
  if (!passphrases.has(context)) {
    const password = resolveLockPassword(context)
    if (password === '') throw new Error('passphrase must not be empty')
    passphrases.set(context, password !== undefined ? password : promptPassphrase())
  }
  return lockedValue(privateKey, await passphrases.get(context), publicKey)
}

function isLocked (value) {
  return typeof value === 'string' && value.startsWith('locked:')
}

function unlockValue (publicKey, ring, passphrase) {
  try {
    const privateKey = unlockedValue(ring[publicKey], passphrase)
    if (derive(privateKey) !== publicKey) throw new Error('key mismatch')
    return { ...ring, [publicKey]: privateKey }
  } catch {
    throw new Errors().invalidPassphrase()
  }
}

function validateLocked (publicKey, ring) {
  const value = ring && ring[publicKey]
  if (!isLocked(value)) return false
  if (!matchesKey(publicKey, value)) throw new Error('invalid locked private key')
  return true
}

function passwordRequired () {
  const error = new Error('[LOCKED_PRIVATE_KEY] supply --lock-password, lockPassword, or DOTENVX_LOCK_PASSWORD to unlock the private key')
  error.code = 'LOCKED_PRIVATE_KEY'
  return error
}

async function unlock (publicKey, ring, options = {}) {
  if (!validateLocked(publicKey, ring)) return ring
  const password = resolveLockPassword(options)
  if (password !== undefined) return unlockValue(publicKey, ring, password)
  if (!process.stdin.isTTY || !process.stderr.isTTY || process.env.CI) throw passwordRequired()
  return unlockValue(publicKey, ring, await promptPassphrase())
}

function unlockSync (publicKey, ring, options = {}) {
  if (!validateLocked(publicKey, ring)) return ring
  const password = resolveLockPassword(options)
  if (password === undefined) throw passwordRequired()
  return unlockValue(publicKey, ring, password)
}

module.exports = { lock, unlock, unlockSync }
