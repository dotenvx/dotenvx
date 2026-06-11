const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const keyValuesFromEnvSrc = require('../../../../src/lib/helpers/keyResolution/keyValuesFromEnvSrc')

t.beforeEach((ct) => {
  process.env = {}
})

t.test('#keyValuesFromEnvSrc with no keys', ct => {
  const result = keyValuesFromEnvSrc('HELLO=World', null, { noArmor: true })

  ct.same(result, { publicKeyValue: null, privateKeyValue: null, privateKeyName: null })
  ct.end()
})

t.test('#keyValuesFromEnvSrc reads explicit private key from processEnv option', ct => {
  const processEnv = { DOTENV_PRIVATE_KEY_PRODUCTION: '<privateKey>' }
  const result = keyValuesFromEnvSrc('HELLO=World', 'DOTENV_PRIVATE_KEY_PRODUCTION', { processEnv, noArmor: true })

  ct.same(result, { publicKeyValue: null, privateKeyValue: '<privateKey>', privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })
  ct.end()
})

t.test('#keyValuesFromEnvSrc reads explicit private key from default .env.keys', ct => {
  const cwd = process.cwd()
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-keyvalues-src-'))
  process.chdir(tmpdir)
  fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY_PRODUCTION="from-file"\n')

  const result = keyValuesFromEnvSrc('HELLO=World', 'DOTENV_PRIVATE_KEY_PRODUCTION', { noArmor: true })

  ct.same(result, { publicKeyValue: null, privateKeyValue: 'from-file', privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })

  process.chdir(cwd)
  ct.end()
})

t.test('#keyValuesFromEnvSrc reads explicit private key from custom .env.keys', ct => {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-keyvalues-src-'))
  const keysFilepath = path.join(tmpdir, 'custom.keys')
  fs.writeFileSync(keysFilepath, 'DOTENV_PRIVATE_KEY_PRODUCTION="from-custom-file"\n')

  const result = keyValuesFromEnvSrc('HELLO=World', 'DOTENV_PRIVATE_KEY_PRODUCTION', { keysFilepath, noArmor: true })

  ct.same(result, { publicKeyValue: null, privateKeyValue: 'from-custom-file', privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })

  ct.end()
})

t.test('#keyValuesFromEnvSrc infers private key name from public key in src', ct => {
  const src = 'DOTENV_PUBLIC_KEY_PRODUCTION="03_public"\nHELLO=World'
  const result = keyValuesFromEnvSrc(src, null, { noArmor: true })

  ct.same(result, { publicKeyValue: '03_public', privateKeyValue: null, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })
  ct.end()
})

t.test('#keyValuesFromEnvSrc prefers public key from processEnv option', ct => {
  const src = 'DOTENV_PUBLIC_KEY_PRODUCTION="03_public_from_src"\nHELLO=World'
  const processEnv = { DOTENV_PUBLIC_KEY_PRODUCTION: '03_public_from_process' }
  const result = keyValuesFromEnvSrc(src, null, { processEnv, noArmor: true })

  ct.same(result, { publicKeyValue: '03_public_from_process', privateKeyValue: null, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })
  ct.end()
})

t.test('#keyValuesFromEnvSrc handles empty public key in src', ct => {
  const src = 'DOTENV_PUBLIC_KEY_PRODUCTION=\nHELLO=World'
  const result = keyValuesFromEnvSrc(src, null, { noArmor: true })

  ct.same(result, { publicKeyValue: null, privateKeyValue: null, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' })
  ct.end()
})

t.test('#keyValuesFromEnvSrc loads private key from armor when noArmor is false and only public key exists', ct => {
  const armorKeypairSync = sinon.stub().returns({ privateKey: 'from-armor' })
  const keyValuesFromEnvSrcWithArmorStub = proxyquire('../../../../src/lib/helpers/keyResolution/keyValuesFromEnvSrc', {
    '../cryptography/armorKeypairSync': armorKeypairSync
  })
  const src = 'DOTENV_PUBLIC_KEY="03_public"\nHELLO=World'

  const result = keyValuesFromEnvSrcWithArmorStub(src, null, { noArmor: false })

  ct.same(result, { publicKeyValue: '03_public', privateKeyValue: 'from-armor', privateKeyName: 'DOTENV_PRIVATE_KEY', privateKeySource: 'armor' })
  ct.equal(armorKeypairSync.callCount, 1)
  ct.equal(armorKeypairSync.firstCall.args[0], '03_public')
  ct.end()
})

t.test('#keyValuesFromEnvSrc forwards token to armor', ct => {
  const armorKeypairSync = sinon.stub().returns({ privateKey: 'from-armor' })
  const keyValuesFromEnvSrcWithArmorStub = proxyquire('../../../../src/lib/helpers/keyResolution/keyValuesFromEnvSrc', {
    '../cryptography/armorKeypairSync': armorKeypairSync
  })
  const src = 'DOTENV_PUBLIC_KEY="03_public"\nHELLO=World'

  const result = keyValuesFromEnvSrcWithArmorStub(src, null, { noArmor: false, token: 'token-123' })

  ct.same(result, { publicKeyValue: '03_public', privateKeyValue: 'from-armor', privateKeyName: 'DOTENV_PRIVATE_KEY', privateKeySource: 'armor' })
  ct.equal(armorKeypairSync.callCount, 1)
  ct.same(armorKeypairSync.firstCall.args, ['03_public', { token: 'token-123' }])
  ct.end()
})

t.test('#keyValuesFromEnvSrc forwards command to armor', ct => {
  const armorKeypairSync = sinon.stub().returns({ privateKey: 'from-armor' })
  const keyValuesFromEnvSrcWithArmorStub = proxyquire('../../../../src/lib/helpers/keyResolution/keyValuesFromEnvSrc', {
    '../cryptography/armorKeypairSync': armorKeypairSync
  })
  const src = 'DOTENV_PUBLIC_KEY="03_public"\nHELLO=World'

  const result = keyValuesFromEnvSrcWithArmorStub(src, null, { noArmor: false, command: ['node', 'index.js'] })

  ct.same(result, { publicKeyValue: '03_public', privateKeyValue: 'from-armor', privateKeyName: 'DOTENV_PRIVATE_KEY', privateKeySource: 'armor' })
  ct.equal(armorKeypairSync.callCount, 1)
  ct.same(armorKeypairSync.firstCall.args, ['03_public', { command: ['node', 'index.js'] }])
  ct.end()
})

t.test('#keyValuesFromEnvSrc does not load private key from armor when noArmor is true', ct => {
  const armorKeypairSync = sinon.stub().returns({ privateKey: 'from-armor' })
  const keyValuesFromEnvSrcWithArmorStub = proxyquire('../../../../src/lib/helpers/keyResolution/keyValuesFromEnvSrc', {
    '../cryptography/armorKeypairSync': armorKeypairSync
  })
  const src = 'DOTENV_PUBLIC_KEY="03_public"\nHELLO=World'

  const result = keyValuesFromEnvSrcWithArmorStub(src, null, { noArmor: true })

  ct.same(result, { publicKeyValue: '03_public', privateKeyValue: null, privateKeyName: 'DOTENV_PRIVATE_KEY' })
  ct.equal(armorKeypairSync.callCount, 0)
  ct.end()
})
