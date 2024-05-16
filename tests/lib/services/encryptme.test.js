const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const dotenv = require('dotenv')

const Encryptme = require('../../../src/lib/services/encryptme')

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
    settableFilepaths
  } = new Encryptme().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    keys: [],
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Encryptme().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    keys: [],
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').throws(new Error('Mock Error'))

  const {
    processedEnvFiles,
    settableFilepaths
  } = new Encryptme().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvFiles, [{
    keys: [],
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

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
    settableFilepaths
  } = new Encryptme(envFile).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.filepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

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
    settableFilepaths
  } = new Encryptme([envFile]).run()

  const p1 = processedEnvFiles[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.filepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})
