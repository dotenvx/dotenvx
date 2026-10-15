const t = require('tap')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { spawnSync } = require('child_process')
const { keypair, encrypt } = require('@dotenvx/primitives')

t.test('unchanged CLI syntax batches five -e arguments and still redacts output', ct => {
  if (process.platform === 'win32') {
    ct.skip('POSIX fake CLI fixture')
    ct.end()
    return
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-batch-cli-'))
  ct.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const log = path.join(dir, 'calls')
  const op = path.join(dir, 'op')
  fs.writeFileSync(op, `#!${process.execPath}\n` + `
const fs = require('fs')
fs.appendFileSync(process.env.TEST_OP_LOG, process.argv[2] + '\\n')
if (process.argv[2] !== 'inject') process.exit(1)
const input = fs.readFileSync(0, 'utf8')
process.stdout.write(input.replace(/\\{\\{ (.*?) \\}\\}/g, (_, reference) => 'fake-password-' + reference.split('/')[3]))
`)
  fs.chmodSync(op, 0o700)
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('OP_') && !key.startsWith('DOTENV_PRIVATE_KEY') && !key.startsWith('DOTENVX_')))
  env.PATH = dir + path.delimiter + (process.env.PATH || '')
  env.TEST_OP_LOG = log
  const args = [path.resolve('src/cli/dotenvx.js'), '--quiet', 'run', '--strict', '--overload', '--redact', '--no-armor', '--no-native', '--no-bitwarden', '-f', '/dev/null']
  for (let i = 1; i <= 5; i++) args.push('-e', `TEST${i}=op://vault/test${i}/password`)
  args.push('--', process.execPath, '-e', `
for (let i = 1; i <= 5; i++) {
  if (process.env['TEST' + i] !== 'fake-password-test' + i) process.exit(1)
}
console.log(process.env.TEST1)
`)
  const result = spawnSync(process.execPath, args, { env, cwd: dir, encoding: 'utf8' })
  ct.equal(result.status, 0, result.stderr)
  ct.equal(fs.readFileSync(log, 'utf8'), 'inject\n')
  ct.notMatch(result.stdout, 'fake-password')
  fs.writeFileSync(log, '')
  fs.writeFileSync(op, `#!${process.execPath}\nprocess.stderr.write('429 quota exceeded'); process.exit(1)\n`)
  const failed = spawnSync(process.execPath, args, { env, cwd: dir, encoding: 'utf8' })
  ct.not(failed.status, 0)
  ct.notMatch(failed.stdout, 'fake-password')
  ct.match(failed.stderr, '1PASSWORD_FAILED')
  ct.end()
})

t.test('one dotenvx invocation decrypts OP authentication before batching five arguments', ct => {
  if (process.platform === 'win32') {
    ct.skip('POSIX fake CLI fixture')
    ct.end()
    return
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-auth-batch-'))
  ct.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const log = path.join(dir, 'calls')
  const op = path.join(dir, 'op')
  const envFile = path.join(dir, '.env')
  const keysFile = path.join(dir, '.env.keys')
  const { publicKey, privateKey } = keypair()
  fs.writeFileSync(envFile, `DOTENV_PUBLIC_KEY=${publicKey}\nOP_SERVICE_ACCOUNT_TOKEN="${encrypt(publicKey, 'fake-service-account-token')}"\n`, { mode: 0o600 })
  fs.writeFileSync(keysFile, `DOTENV_PRIVATE_KEY=${privateKey}\n`, { mode: 0o600 })
  fs.writeFileSync(op, `#!${process.execPath}\n` + `
const fs = require('fs')
if (process.env.OP_SERVICE_ACCOUNT_TOKEN !== 'fake-service-account-token') process.exit(1)
fs.appendFileSync(process.env.TEST_OP_LOG, process.argv[2] + '\\n')
if (process.argv[2] !== 'inject') process.exit(1)
const input = fs.readFileSync(0, 'utf8')
process.stdout.write(input.replace(/\\{\\{ (.*?) \\}\\}/g, (_, reference) => 'fake-password-' + reference.split('/')[3]))
`)
  fs.chmodSync(op, 0o700)
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('OP_') && !key.startsWith('DOTENV_PRIVATE_KEY') && !key.startsWith('DOTENVX_')))
  env.PATH = dir + path.delimiter + (process.env.PATH || '')
  env.TEST_OP_LOG = log
  const args = [path.resolve('src/cli/dotenvx.js'), '--quiet', 'run', '--strict', '--overload', '--redact', '--no-armor', '--no-native', '--no-bitwarden', '-f', envFile, '--env-keys-file', keysFile]
  for (let i = 1; i <= 5; i++) args.push('-e', `TEST${i}=op://vault/test${i}/password`)
  args.push('--', 'env', '-u', 'OP_SERVICE_ACCOUNT_TOKEN', process.execPath, '-e', `
if (process.env.OP_SERVICE_ACCOUNT_TOKEN !== undefined) process.exit(1)
for (let i = 1; i <= 5; i++) {
  if (process.env['TEST' + i] !== 'fake-password-test' + i) process.exit(1)
}
console.log(process.env.TEST1)
`)
  const result = spawnSync(process.execPath, args, { env, cwd: dir, encoding: 'utf8' })
  ct.equal(result.status, 0, result.stderr)
  ct.equal(fs.readFileSync(log, 'utf8'), 'inject\n')
  ct.notMatch(result.stdout + result.stderr, 'fake-password')
  ct.notMatch(result.stdout + result.stderr, 'fake-service-account-token')
  ct.end()
})
