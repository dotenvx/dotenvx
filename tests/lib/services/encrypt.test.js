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
    filepath: '.env',
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
    filepath: '.env',
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
    filepath: '.env',
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  readFileSyncStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  // Stub writeFileSync to capture the written content
  let writtenContent
  writeFileSyncStub.restore()
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync').callsFake((filePath, content) => {
    writtenContent = content
  })

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.filepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenv.parse(writtenContent)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

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
  ct.same(p1.filepath, 'tests/monorepo/apps/frontend/.env')
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
  ct.same(p1.filepath, 'tests/monorepo/apps/encrypted/.env')
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
  ct.same(p1.filepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})
