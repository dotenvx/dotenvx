const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const dotenv = require('dotenv')

const Encrypt = require('../../../src/lib/services/encrypt')

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
  } = new Encrypt().run()

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
  } = new Encrypt().run()

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
  } = new Encrypt().run()

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
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file with multiline value)', ct => {
  const envFile = 'tests/monorepo/apps/multiline/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiline/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiline/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

  const output = `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="${parsed.DOTENV_PUBLIC_KEY}"

# .env
HELLO="${parsed.HELLO}"
`
  ct.same(p1.envSrc, output)

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Encrypt([envFile]).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (finds .env file already encrypted)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, [])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Encrypt([envFile]).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (finds .env file with specified key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, ['HELLO2']).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file with specified key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, 'HELLO2').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})
