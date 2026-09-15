const { execFile, execFileSync } = require('child_process')
const { derive } = require('@dotenvx/primitives')
const Session = require('../../db/session')
const armoredKeyDisplay = require('./armoredKeyDisplay')

const PREFIX = 'DOTENVX_ONEPASSWORD_'
const ID = /^[a-z0-9]{26}$/i
const COMMAND_OPTIONS = { encoding: 'utf8', windowsHide: true, timeout: 120000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 }

function failure (message) {
  const error = new Error(message)
  error.code = '1PASSWORD_FAILED'
  return error
}

function commandError (args, stderr) {
  const step = args[0] === 'item'
    ? (args[1] === 'delete' ? 'delete the key item' : 'create the key item')
    : {
        whoami: 'check the signed-in account',
        signin: 'sign in',
        read: 'read the private key'
      }[args[0]] || 'check availability'
  if (/account is not signed in/i.test(String(stderr || ''))) {
    const error = failure(`1Password could not ${step}: account is not signed in. Sign in with op signin or enable the desktop app CLI integration`)
    error.reason = 'NOT_SIGNED_IN'
    return error
  }
  return failure(`1Password could not ${step}; check sign-in and vault permissions`)
}

function run (args, input, timeout = COMMAND_OPTIONS.timeout) {
  return new Promise((resolve, reject) => {
    // On Unix, Node supplies a socket for stdin. op only detects piped JSON
    // through a real pipe, so cat bridges the socket without writing a file.
    const pipeInput = input !== undefined && process.platform !== 'win32'
    const command = pipeInput ? '/bin/sh' : 'op'
    const commandArgs = pipeInput ? ['-c', 'cat | op "$@"', 'dotenvx-op', ...args] : args
    let timer
    const child = execFile(command, commandArgs, {
      ...COMMAND_OPTIONS,
      timeout: pipeInput ? 0 : timeout,
      ...(pipeInput ? { detached: true } : {})
    }, (error, stdout, stderr) => {
      clearTimeout(timer)
      // Subprocess errors may include secrets from stdin or stdout.
      if (error) reject(commandError(args, stderr))
      else resolve(stdout)
    })
    if (pipeInput) {
      timer = setTimeout(() => {
        // Kill the whole pipeline, including op, if authentication times out.
        try { process.kill(-child.pid, 'SIGKILL') } catch {}
      }, timeout)
      timer.unref()
    }
    if (child.stdin) {
      child.stdin.on('error', () => {})
      child.stdin.end(input)
    }
  })
}

function parseResponse (value) {
  try { return JSON.parse(value) } catch {
    throw failure('1Password CLI returned an invalid response')
  }
}

async function available () {
  try {
    const version = await run(['--version'], undefined, 2000)
    if (!/^2\./.test(version.trim())) return false
    if (process.env.OP_SERVICE_ACCOUNT_TOKEN) return true
    // Account discovery is local; authenticate only after the user selects 1Password.
    const accounts = parseResponse(await run(['account', 'list', '--format=json'], undefined, 2000))
    return Array.isArray(accounts) && accounts.length > 0
  } catch {
    return false
  }
}

function configured () {
  const store = new Session().openStore()
  return !!store && Object.keys(store.store).some(key => key.startsWith(PREFIX))
}

function location (publicKey) {
  const store = new Session().openStore()
  const value = store && store.get(`${PREFIX}${publicKey}`)
  if (!value) return null
  const [account, reference] = String(value).split('|')
  if (!ID.test(account) || !/^op:\/\/[a-z0-9]{26}\/[a-z0-9]{26}\/(?:private_key|password)$/i.test(reference || '')) {
    throw failure('invalid 1Password private-key reference in dotenvx settings')
  }
  return { account, reference }
}

function verified (publicKey, privateKey) {
  try {
    if (derive(privateKey) === publicKey) return { [publicKey]: privateKey }
  } catch {}
  throw failure('1Password private key does not match the .env public key')
}

async function get (publicKey) {
  const loc = location(publicKey)
  if (!loc) return {}
  const privateKey = await run(['read', loc.reference, '--no-newline', `--account=${loc.account}`])
  return verified(publicKey, privateKey.trim())
}

function getSync (publicKey) {
  const loc = location(publicKey)
  if (!loc) return {}
  let privateKey
  try {
    privateKey = execFileSync('op', ['read', loc.reference, '--no-newline', `--account=${loc.account}`], {
      ...COMMAND_OPTIONS, stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch {
    throw failure('1Password CLI could not read the private key; check sign-in and vault permissions')
  }
  return verified(publicKey, privateKey)
}

async function set (publicKey, privateKey) {
  let identity
  try {
    identity = parseResponse(await run(['whoami', '--format=json']))
  } catch (error) {
    if (error.reason !== 'NOT_SIGNED_IN' || process.env.OP_SERVICE_ACCOUNT_TOKEN) throw error
    // whoami checks authentication but does not initiate the desktop app flow.
    // Discard signin output; never print or evaluate a returned session token.
    await run(['signin'])
    identity = parseResponse(await run(['whoami', '--format=json']))
  }
  const account = identity.account_uuid
  if (!ID.test(account || '')) throw failure('could not identify the signed-in 1Password account')
  const item = parseResponse(await run(['item', 'create', '-', '--format=json', `--account=${account}`], JSON.stringify({
    title: `dotenvx (${armoredKeyDisplay(publicKey)})`,
    category: 'PASSWORD',
    tags: ['dotenvx'],
    fields: [
      { id: 'password', label: 'private_key', type: 'CONCEALED', purpose: 'PASSWORD', value: privateKey },
      { id: 'public_key', label: 'public_key', type: 'STRING', value: publicKey }
    ]
  })))
  if (!ID.test(item.id || '')) throw failure('1Password did not return a saved item ID')
  const vault = item.vault && item.vault.id
  if (!ID.test(vault || '')) throw failure('1Password did not return the saved item vault ID')
  const reference = `op://${vault}/${item.id}/password`
  const saved = await run(['read', reference, '--no-newline', `--account=${account}`])
  if (saved.trim() !== privateKey) throw failure('could not verify private key in 1Password')
  // Only a nonsecret locator is persisted locally, never the private key.
  new Session().createStore().set(`${PREFIX}${publicKey}`, `${account}|${reference}`)
}

async function remove (publicKey) {
  const loc = location(publicKey)
  if (!loc) return
  const [vault, item] = loc.reference.slice('op://'.length).split('/')
  await run(['item', 'delete', item, `--vault=${vault}`, `--account=${loc.account}`])
  new Session().openStore().delete(`${PREFIX}${publicKey}`)
}

module.exports = { available, configured, get, getSync, set, delete: remove }
