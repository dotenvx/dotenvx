const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

// Exercise the packed package against the real OS vault, without transfer commands.
const root = path.dirname(require.resolve('@dotenvx/dotenvx/package.json', { paths: [process.cwd()] }))
const helper = { linux: 'linuxSecretService', win32: 'windowsCredentialManager' }[process.platform]
assert.ok(helper, 'supported CI platform')
const store = require(path.join(root, 'src/lib/helpers', helper))
const cli = path.join(root, 'src/cli/dotenvx.js')
const env = { ...process.env, CI: '', DOTENVX_NO_ARMOR: 'true' }
const run = (...args) => execFileSync(process.execPath, [cli, ...args], { env, encoding: 'utf8' }).trim()
const value = 'NativeStoreTest'

fs.writeFileSync('.env', `HELLO=${value}\n`)
run('encrypt', '--no-armor', '--no-native')
const publicKey = fs.readFileSync('.env', 'utf8').match(/^DOTENV_PUBLIC_KEY="([^"]+)"/m)[1]
const privateKey = fs.readFileSync('.env.keys', 'utf8').match(/^DOTENV_PRIVATE_KEY="([^"]+)"/m)[1]

try {
  store.set(publicKey, privateKey, 'dotenvx CI')
  assert.equal(store.get(publicKey), privateKey)
  fs.unlinkSync('.env.keys')
  assert.equal(run('get', 'HELLO'), value)
} finally {
  store.delete(publicKey)
}
assert.equal(store.get(publicKey), null)
console.log('Native key storage and dotenvx get passed')
