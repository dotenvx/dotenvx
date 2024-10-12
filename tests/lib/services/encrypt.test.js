const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')
const dotenv = require('dotenv')

const Encrypt = require('../../../src/lib/services/encrypt')

let writeFileXStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  writeFileXStub = sinon.stub(fsx, 'writeFileX')
})

t.afterEach((ct) => {
  writeFileXStub.restore()
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
  const readFileXStub = sinon.stub(fsx, 'readFileX').throws(new Error('Mock Error'))

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

  readFileXStub.restore()

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
HELLO='${parsed.HELLO}'
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

t.test('#run (finds .env file with specified glob string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, 'H*').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO', 'HELLO2', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO2 should start with "encrypted:"')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file excluding specified key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, [], ['HELLO2']).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should not be encrypted')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file excluding specified key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, [], 'HELLO3').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO', 'HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO2 should start with "encrypted:"')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should not be encrypted')

  ct.end()
})

t.test('#run (finds .env file excluding specified key globbed)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile, [], 'HE*').run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, [])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should not be encrypted')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should not be encrypted')

  ct.end()
})

t.test('#run (finds .env.export file with exported key)', ct => {
  const envFile = 'tests/.env.export'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['KEY'])
  ct.same(p1.envFilepath, 'tests/.env.export')
  ct.same(changedFilepaths, ['tests/.env.export'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_EXPORT', 'KEY'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_EXPORT, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.KEY, /^encrypted:/, 'KEY should start with "encrypted:"')

  const output = `#!/usr/bin/env bash
#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY_EXPORT="${parsed.DOTENV_PUBLIC_KEY_EXPORT}"

# .env.export
export KEY='${parsed.KEY}'
`
  ct.same(p1.envSrc, output)

  ct.end()
})
