const t = require('tap')
const fs = require('fs')
const path = require('path')
const os = require('os')

const keypairMetadata = require('../../../src/lib/helpers/keypairMetadata')

t.test('keypairMetadata includes file context and command string from metadata json', ct => {
  const cwd = process.cwd()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-keypair-metadata-'))
  const envFile = path.join(dir, '.env.production')

  fs.writeFileSync(envFile, [
    'HELLO=World',
    'DATABASE_URL=postgres://localhost/db'
  ].join('\n'))

  process.chdir(dir)
  ct.teardown(() => {
    process.chdir(cwd)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  const result = keypairMetadata('.env.production', JSON.stringify({
    command: 'dotenvx run -f .env.production -- npm start'
  }))

  ct.same(result, {
    filepath: '.env.production',
    filename: '.env.production',
    environment: 'production',
    project_name: path.basename(dir),
    keys: ['HELLO', 'DATABASE_URL'],
    command: 'dotenvx run -f .env.production -- npm start'
  }, 'returns normalized keypair metadata')
  ct.end()
})

t.test('keypairMetadata omits command for invalid metadata json', ct => {
  const result = keypairMetadata('.env.missing', 'not json')

  ct.equal(result.command, undefined, 'does not include malformed command metadata')
  ct.equal(result.filename, '.env.missing', 'still includes filename')
  ct.equal(result.environment, 'missing', 'still includes environment')
  ct.end()
})

t.test('keypairMetadata redacts token values from command metadata', ct => {
  const result = keypairMetadata('.env.missing', JSON.stringify({
    command: 'dotenvx keypair --token token-123 -f .env.production'
  }))

  ct.equal(result.command, 'dotenvx keypair --token [REDACTED] -f .env.production')
  ct.end()
})

t.test('keypairMetadata reads key names without decrypting env values', ct => {
  const cwd = process.cwd()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-keypair-metadata-'))
  const envFile = path.join(dir, '.env')

  fs.writeFileSync(envFile, [
    'DOTENV_PUBLIC_KEY="03abc"',
    'HELLO="encrypted:abc123"'
  ].join('\n'))

  process.chdir(dir)
  ct.teardown(() => {
    process.chdir(cwd)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  const result = keypairMetadata('.env')

  ct.same(result.keys, ['DOTENV_PUBLIC_KEY', 'HELLO'], 'returns keys without requiring main.parse/decryption')
  ct.end()
})
