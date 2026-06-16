const t = require('tap')
const fs = require('fs')
const path = require('path')
const os = require('os')

const readEnvKey = require('../../../src/lib/helpers/readEnvKey')

t.test('readEnvKey reads a key from an env file without decrypting', ct => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-read-env-key-'))
  const envFile = path.join(dir, '.env')

  fs.writeFileSync(envFile, [
    'DOTENV_PUBLIC_KEY="03abc"',
    'HELLO="encrypted:abc123"'
  ].join('\n'))

  ct.teardown(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  ct.equal(readEnvKey('HELLO', envFile, { strict: true }), 'encrypted:abc123')
  ct.end()
})

t.test('readEnvKey respects ignored missing key errors', ct => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-read-env-key-'))
  const envFile = path.join(dir, '.env')

  fs.writeFileSync(envFile, 'HELLO=World')

  ct.teardown(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  ct.equal(readEnvKey('MISSING', envFile, { strict: true, ignore: ['MISSING_KEY'] }), undefined)
  ct.throws(() => readEnvKey('MISSING', envFile, { strict: true }), { code: 'MISSING_KEY' })
  ct.end()
})
