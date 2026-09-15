const { execFile, execFileSync } = require('child_process')
const { derive } = require('@dotenvx/primitives')
const Session = require('../../db/session')
const prompts = require('./prompts')
const createSpinner = require('./createSpinner')
let unlockedSession

const armoredKeyDisplay = require('./armoredKeyDisplay')

const PREFIX = 'DOTENVX_BITWARDEN_'
const ID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
const COMMAND_OPTIONS = { encoding: 'utf8', windowsHide: true, timeout: 120000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 }

function failure (message) {
  const error = new Error(message)
  error.code = 'BITWARDEN_FAILED'
  return error
}

function commandFailure () {
  return failure('Bitwarden CLI operation failed; check sign-in and unlock your vault with BW_SESSION')
}

function run (args, input, timeout = COMMAND_OPTIONS.timeout, env = commandEnv()) {
  return new Promise((resolve, reject) => {
    const child = execFile('bw', [...args, '--nointeraction'], { ...COMMAND_OPTIONS, timeout, env }, (error, stdout) => {
      if (error) reject(commandFailure())
      else resolve(stdout)
    })
    if (child.stdin) {
      child.stdin.on('error', () => {})
      child.stdin.end(input)
    }
  })
}

function parse (value) {
  try { return JSON.parse(value) } catch {
    throw failure('Bitwarden CLI returned an invalid response')
  }
}

async function available () {
  try { return /^\d+\.\d+\.\d+/.test((await run(['--version'], undefined, 2000)).trim()) } catch { return false }
}

function configured () {
  const store = new Session().openStore()
  return !!store && Object.keys(store.store).some(key => key.startsWith(PREFIX))
}

function location (publicKey) {
  const store = new Session().openStore()
  const value = store && store.get(`${PREFIX}${publicKey}`)
  if (!value) return null
  // Base64 keeps the nonsecret JSON locator safe in the dotenv settings file.
  const loc = parse(Buffer.from(String(value), 'base64').toString('utf8'))
  if (!loc || !ID.test(loc.item || '') || !ID.test(loc.userId || '') || typeof loc.serverUrl !== 'string') {
    throw failure('invalid Bitwarden private-key reference in dotenvx settings')
  }
  return loc
}

function commandEnv () {
  return { ...process.env, ...(unlockedSession ? { BW_SESSION: unlockedSession } : {}) }
}

async function authenticate (loc) {
  let status = parse(await run(['status']))
  if (loc && status && status.userId && (status.userId !== loc.userId || (status.serverUrl || '') !== loc.serverUrl)) {
    throw failure('Bitwarden account or server does not match the stored private-key reference')
  }
  if (status && status.status === 'unlocked') return checkIdentity(status, loc)
  unlockedSession = undefined
  if (status && status.status === 'unauthenticated') throw failure('Sign in to Bitwarden once with bw login, then retry; dotenvx will prompt to unlock your vault')
  if (!status || status.status !== 'locked') throw commandFailure()
  if (!process.stdin.isTTY || !process.stderr.isTTY || process.env.CI) {
    throw failure('Bitwarden is locked; set an unlocked BW_SESSION for noninteractive use')
  }
  let password
  createSpinner.pause()
  try {
    password = await prompts.password({ message: 'Bitwarden master password', prefix: '◇', separator: '=' }, { input: process.stdin, output: process.stderr })
  } finally {
    createSpinner.resume()
  }
  const passwordEnv = 'DOTENVX_BITWARDEN_PASSWORD'
  const session = (await run(['unlock', '--passwordenv', passwordEnv, '--raw'], undefined, COMMAND_OPTIONS.timeout, { ...process.env, [passwordEnv]: password })).trim()
  if (!session) throw commandFailure()
  unlockedSession = session
  try {
    status = parse(await run(['status']))
    return checkIdentity(status, loc)
  } catch (error) {
    unlockedSession = undefined
    throw error
  }
}

function requireSession () {
  if (!unlockedSession && !process.env.BW_SESSION) throw failure('Bitwarden requires an unlocked BW_SESSION; run bw login, then bw unlock --raw and set BW_SESSION')
}

function checkIdentity (status, loc) {
  if (!status || status.status !== 'unlocked' || !ID.test(status.userId || '')) throw commandFailure()
  if (loc && (status.userId !== loc.userId || (status.serverUrl || '') !== loc.serverUrl)) {
    throw failure('Bitwarden account or server does not match the stored private-key reference')
  }
  return status
}

function verified (publicKey, privateKey) {
  try { if (derive(privateKey) === publicKey) return { [publicKey]: privateKey } } catch {}
  throw failure('Bitwarden private key does not match the .env public key')
}

async function get (publicKey) {
  const loc = location(publicKey)
  if (!loc) return {}
  await authenticate(loc)
  return verified(publicKey, (await run(['get', 'password', loc.item])).trim())
}

function getSync (publicKey) {
  const loc = location(publicKey)
  if (!loc) return {}
  requireSession()
  function read (args) {
    try { return execFileSync('bw', [...args, '--nointeraction'], { ...COMMAND_OPTIONS, env: commandEnv(), stdio: ['ignore', 'pipe', 'pipe'] }) } catch { throw commandFailure() }
  }
  checkIdentity(parse(read(['status'])), loc)
  return verified(publicKey, read(['get', 'password', loc.item]).trim())
}

async function set (publicKey, privateKey) {
  verified(publicKey, privateKey)
  if (location(publicKey)) {
    await get(publicKey)
    return
  }
  const status = await authenticate()
  const template = {
    organizationId: null,
    collectionIds: [],
    folderId: null,
    type: 1,
    name: `dotenvx (${armoredKeyDisplay(publicKey)})`,
    notes: null,
    favorite: false,
    fields: [{ name: 'public_key', value: publicKey, type: 0 }],
    login: { username: 'private_key', password: privateKey, totp: null, uris: [] }
  }
  // Pass encoded JSON on stdin, never secrets in command arguments or files.
  const item = parse(await run(['create', 'item'], Buffer.from(JSON.stringify(template)).toString('base64')))
  if (!item || !ID.test(item.id || '') || item.organizationId) throw failure('Bitwarden did not return a personal vault item')
  const saved = (await run(['get', 'password', item.id])).trim()
  verified(publicKey, saved)
  const loc = { item: item.id, userId: status.userId, serverUrl: status.serverUrl || '' }
  new Session().createStore().set(`${PREFIX}${publicKey}`, Buffer.from(JSON.stringify(loc)).toString('base64'))
}

async function remove (publicKey) {
  const loc = location(publicKey)
  if (!loc) return
  await authenticate(loc)
  await run(['delete', 'item', loc.item])
  new Session().openStore().delete(`${PREFIX}${publicKey}`)
}

module.exports = { available, configured, get, getSync, set, delete: remove }
