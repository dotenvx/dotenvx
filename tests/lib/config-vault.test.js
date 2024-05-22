const fs = require('fs')
const crypto = require('crypto')
const sinon = require('sinon')
const t = require('tap')

const dotenvx = require('../../src/lib/main')
const { logger } = require('../../src/shared/logger')

const testPath = 'tests/.env'

const dotenvKey = 'dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault?environment=development'

let envStub
let logStub

t.beforeEach(() => {
  process.env.DOTENV_KEY = ''
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value(dotenvKey)
})

t.afterEach(() => {
  envStub.restore()

  if (logStub) {
    logStub.restore()
  }
})

t.test('logs when no path is set', ct => {
  logStub = sinon.stub(logger, 'error')

  dotenvx.config()
  ct.ok(logStub.called)

  ct.end()
})

t.test('logs', ct => {
  logStub = sinon.stub(logger, 'successv')

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)

  ct.end()
})

t.test('warns if DOTENV_KEY exists but .env.vault does not exist', ct => {
  logStub = sinon.stub(logger, 'error')

  const existsSync = sinon.stub(fs, 'existsSync').returns(false) // make .env.vault not exist
  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)
  existsSync.restore()

  ct.end()
})

t.test('log if DOTENV_KEY exists but .env.vault does not exist (set as array)', ct => {
  logStub = sinon.stub(logger, 'error')

  const existsSync = sinon.stub(fs, 'existsSync').returns(false) // make .env.vault not exist
  dotenvx.config({ path: [testPath] })
  ct.ok(logStub.called)
  existsSync.restore()

  ct.end()
})

t.test('returns parsed object', ct => {
  const env = dotenvx.config({ path: testPath })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('returns parsed object (set path as array)', ct => {
  const env = dotenvx.config({ path: [testPath] })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('returns parsed object (set path as mulit-array)', ct => {
  const env = dotenvx.config({ path: ['tests/.env.local', 'tests/.env'] })
  ct.same(env.parsed, { ALPHA: 'zeta' })

  ct.end()
})

t.test('log NOT_FOUND_DOTENV_ENVIRONMENT if .env.vault is empty', ct => {
  logStub = sinon.stub(logger, 'error')
  const readFileSync = sinon.stub(fs, 'readFileSync').returns('') // empty file

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)

  const expectedMessage = 'NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment DOTENV_VAULT_DEVELOPMENT in your .env.vault file'
  ct.ok(logStub.calledWith(expectedMessage))

  readFileSync.restore()
  ct.end()
})

t.test('throws error when invalid formed DOTENV_KEY', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('invalid-format-non-uri-format')

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)

  const expectedMessage = 'INVALID_DOTENV_KEY: Invalid URL'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('throws error when invalid formed DOTENV_KEY that otherwise is not caught', ct => {
  logStub = sinon.stub(logger, 'error')
  const urlStub = sinon.stub(global, 'URL')
  urlStub.callsFake(() => {
    throw new Error('uncaught error')
  })

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)

  const expectedMessage = 'INVALID_DOTENV_KEY: uncaught error'
  ct.ok(logStub.calledWith(expectedMessage))

  urlStub.restore()
  ct.end()
})

t.test('throws error when DOTENV_KEY missing password', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://username@dotenvx.com/vault/.env.vault?environment=development')

  dotenvx.config({ path: testPath })

  ct.ok(logStub.called)

  const expectedMessage = 'INVALID_DOTENV_KEY: Missing key part'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('throws error when DOTENV_KEY missing environment', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault')

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)

  const expectedMessage = 'INVALID_DOTENV_KEY: Missing environment part'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('when DOTENV_KEY is empty string falls back to .env file', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('')

  const result = dotenvx.config({ path: testPath })
  ct.equal(result.parsed.BASIC, 'basic')

  ct.end()
})

t.test('does not write over keys already in process.env by default', ct => {
  const existing = 'bar'
  process.env.ALPHA = existing

  const result = dotenvx.config({ path: testPath })

  ct.equal(result.parsed.ALPHA, 'bar')
  ct.equal(process.env.ALPHA, 'bar')

  ct.end()
})

t.test('does write over keys already in process.env if override turned on', ct => {
  const existing = 'bar'
  process.env.ALPHA = existing

  const result = dotenvx.config({ path: testPath, override: true })

  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'zeta')

  ct.end()
})

t.test('when DOTENV_KEY is passed as an option it successfully decrypts and injects', ct => {
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('')

  const result = dotenvx.config({ path: testPath, DOTENV_KEY: dotenvKey })

  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'zeta')

  ct.end()
})

t.test('can write to a different object rather than process.env', ct => {
  process.env.ALPHA = 'other' // reset process.env

  const myObject = {}

  const result = dotenvx.config({ path: testPath, processEnv: myObject })
  ct.equal(result.parsed.ALPHA, 'zeta')
  ct.equal(process.env.ALPHA, 'other')
  ct.equal(myObject.ALPHA, 'zeta')

  ct.end()
})

t.test('logs when debug and override are turned on', ct => {
  logStub = sinon.stub(logger, 'debug')

  dotenvx.config({ path: testPath, override: true, debug: true })

  ct.ok(logStub.called)
  const expectedMessage = 'ALPHA set to zeta'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('logs when debug is on and override is false', ct => {
  logStub = sinon.stub(logger, 'debug')

  dotenvx.config({ path: testPath, override: false, debug: true })

  ct.ok(logStub.called)
  const expectedMessage = 'ALPHA pre-exists as zeta (protip: use --overload to override)'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('raises an INVALID_DOTENV_KEY if key RangeError', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development')

  dotenvx.config({ path: testPath })

  ct.ok(logStub.called)
  const expectedMessage = 'INVALID_DOTENV_KEY: It must be 64 characters long (or more)'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('raises an DECRYPTION_FAILED if key fails to decrypt payload', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development')

  dotenvx.config({ path: testPath })

  ct.ok(logStub.called)
  const expectedMessage = '[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('raises an DECRYPTION_FAILED if both (comma separated) keys fail to decrypt', ct => {
  logStub = sinon.stub(logger, 'error')
  envStub.restore()
  envStub = sinon.stub(process.env, 'DOTENV_KEY').value('dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_c04959b64473e43dd60c56a536ef8481388528b16759736d89515c25eec69247@dotenvx.com/vault/.env.vault?environment=development')

  dotenvx.config({ path: testPath })

  ct.ok(logStub.called)
  const expectedMessage = '[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.'
  ct.ok(logStub.calledWith(expectedMessage))

  ct.end()
})

t.test('raises error if some other uncaught decryption error', ct => {
  logStub = sinon.stub(logger, 'error')
  const decipherStub = sinon.stub(crypto, 'createDecipheriv')
  decipherStub.callsFake(() => {
    throw new Error('uncaught error')
  })

  dotenvx.config({ path: testPath })
  ct.ok(logStub.called)
  const expectedMessage = 'uncaught error'
  ct.ok(logStub.calledWith(expectedMessage))

  decipherStub.restore()

  ct.end()
})
