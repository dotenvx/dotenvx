const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const dotenv = require('dotenv')

const Decrypt = require('../../../src/lib/services/decrypt')

let writeFileSyncStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    keys: [],
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    error: exampleError
  }])
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, [])

  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    keys: [],
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    error: exampleError
  }])
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').throws(new Error('Mock Error'))

  const {
    processedEnvFiles,
    changedFilepaths
  } = new Decrypt().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvFiles, [{
    keys: [],
    envFilepath: '.env',
    filepath: path.resolve('.env'),
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  readFileSyncStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.same(parsed.HELLO, 'encrypted') // the decrypted value is 'encrypted'

  ct.end()
})

t.test('#run (finds .env file with multiline value)', ct => {
  const envFile = 'tests/monorepo/apps/multiline/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, [])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiline/.env')
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/multiline/.env'])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['HELLO'])
  ct.same(parsed.HELLO, `-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
IJKL
-----END RSA PRIVATE KEY-----`)

  const output = `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
IJKL
-----END RSA PRIVATE KEY-----"
`
  ct.same(p1.envSrc, output)

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Decrypt([envFile]).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  ct.end()
})

t.test('#run (finds .env file with specified key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env.production'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile, ['HELLO2']).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should still be encrypted')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should be decrypted')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should still be encrypted')

  ct.end()
})

t.test('#run (finds .env file with specified key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env.production'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile, 'HELLO2').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should still be encrypted')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should be decrypted')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should still be encrypted')

  ct.end()
})

t.test('#run (finds .env file with excluded key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env.production'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile, [], ['HELLO2']).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should be decrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should still be encrypted')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should be decrypted')

  ct.end()
})

t.test('#run (finds .env file with excluded key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env.production'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Decrypt(envFile, [], 'HELLO2').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should be decrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should still be encrypted')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should be decrypted')

  ct.end()
})
