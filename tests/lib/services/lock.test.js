const t = require('tap')
const fs = require('node:fs')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Lock = require('../../../src/lib/services/lock')
const { logger } = require('../../../src/shared/logger')
const { stubLoggers, allLoggerNames, showLoggerCalls } = require('../../utils/showLoggerCalls')
const Errors = require('../../../src/lib/helpers/errors')

// const Errors = require('../../../src/lib/helpers/errors')
/** @typedef {import('../../utils/showLoggerCalls').SinonStubbedLoggerSet} SinonStubbedLoggerSet */

let writeFileXStub

/** @type {SinonStubbedLoggerSet} */
let loggerStubs

const originalPWD = process.env.PWD

t.beforeEach((ct) => {
  sinon.restore()
  logger.setLevel('info')

  // important, clear process.env before each test
  process.env = {}

  writeFileXStub = sinon.stub(fsx, 'writeFileX')
  loggerStubs = stubLoggers(allLoggerNames, true)
})

t.afterEach((ct) => {
  sinon.restore()
  showLoggerCalls(loggerStubs, ct.name)

  loggerStubs = {}
  writeFileXStub.restore()
})

// =================================================================================================================
t.test('#lock service - falsy input envs[] gives error', ct => {
  // const passPhrase = 'myS3cr3tP@ssPhr@s3'
  // const salt = 'dotenvx_salt'

  // replace 'services/lock#determineEnvs' with a stubbed version
  const FakeLock = proxyquire('../../../src/lib/services/lock', {
    '../helpers/determineEnvs': () => {
      return []
    }
  })

  const {
    processedEnvs
  } = new FakeLock([], '.env.keys', 'myS3cr3tP@ssPhr@s3', 'dotenvx_salt').run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  const exampleError = new Errors({ command: 'lock' }).invalidArguments()
  exampleError.code = 'INVALID_ARGUMENTS'

  ct.same(processedEnvs, [{
    error: exampleError
  }])

  ct.end()
})

// =================================================================================================================
t.test('#lock service - passing a valid unlocked private key file - OK', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = '.env.keys'
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  const fakeReadFileFn = (filename) => {
    logger.debug('readFileSync/readFileX called with args:', filename)
    if (/** @type {string} */ (filename).endsWith('.keys')) {
      return privateKeyFileContents
    } else {
      return publicKeyFileContents
    }
  }

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fs, 'readFileSync').callsFake(fakeReadFileFn)
  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(fakeReadFileFn)
  // existsSync will always return true
  sinon.stub(fsx, 'existsSync').callsFake((...args) => { logger.debug('existsSync called with args:', ...args); return true })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns([envKeysFile, envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  t.ok(loggerStubs.debug.calledWithMatch(`Using private key name: DOTENV_PRIVATE_KEY; existingPrivateKey: my_private_key; envKeysFilepath: ${originalPWD}/.env.keys`), 'logger.debug suggests private key found')
  t.ok(loggerStubs.verbose.calledWithMatch(`DOTENV_PRIVATE_KEY encrypted; updating value in ${originalPWD}/.env.keys`), 'logger.info suggests private key was encrypted')
  t.ok(loggerStubs.debug.calledWithMatch('passphrase is set: true'), 'logger.debug suggests passphrase is set')
  t.ok(writeFileXStub.calledWithMatch(`${originalPWD}/.env.keys`, /^DOTENV_PRIVATE_KEY=encrypted:/), 'writeFileX called with encrypted private key')

  ct.end()
})

// =================================================================================================================
t.test('#lock service - passing an already-locked private key file', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = '.env.keys'
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=encrypted:encrypted_private_key_value'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(
    (filename) => {
      logger.debug('readFileX called with args:', filename)
      if (/** @type {string} */ (filename).endsWith('.keys')) {
        return privateKeyFileContents
      } else {
        return publicKeyFileContents
      }
    }
  )
  // existsSync will always return true
  sinon.stub(fsx, 'existsSync').callsFake((...args) => { logger.debug('existsSync called with args:', ...args); return true })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns([envKeysFile, envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  t.ok(!writeFileXStub.called, 'writeFileX should not have been called')

  ct.end()
})

// =================================================================================================================
t.test('#lock service - missing passPhrase causes error', ct => {
  const passPhrase = undefined
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = '.env.keys'
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(
    (filename) => {
      logger.debug('readFileX called with args:', filename)
      if (/** @type {string} */ (filename).endsWith('.keys')) {
        return privateKeyFileContents
      } else {
        return publicKeyFileContents
      }
    }
  )
  // existsSync will always return true
  sinon.stub(fsx, 'existsSync').callsFake((...args) => { logger.debug('existsSync called with args:', ...args); return true })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns([envKeysFile, envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  const expectedProcessedEnvs = [
    {
      type: 'envFile',
      filepath: `${originalPWD}/.env`,
      changed: false,
      locked: false,
      error: {
        code: 'INVALID_PASS_PHRASE'
      }
    }
  ]

  t.ok(loggerStubs.debug.calledWithMatch('No passphrase provided for locking; adding an error'), 'logger.debug suggests an error was added')
  t.ok(!writeFileXStub.called, 'writeFileX should not have been called')
  t.same(processedEnvs, expectedProcessedEnvs)
  ct.end()
})

// =================================================================================================================
t.test('#lock service - passing a .env.keys file that does not exist', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = '.env.keys'
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(
    (filename) => {
      logger.debug('readFileX called with args:', filename)
      if (/** @type {string} */ (filename).endsWith('.keys')) {
        return privateKeyFileContents
      } else {
        return publicKeyFileContents
      }
    }
  )
  // existsSync says that .env.keys files do not exist
  sinon.stub(fsx, 'existsSync').callsFake((filepath) => { return !filepath.endsWith('.keys') })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns([envKeysFile, envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  const expectedProcessedEnvs = [
    {
      type: 'envFile',
      filepath: `${originalPWD}/.env`,
      changed: false,
      locked: false,
      error: {
        code: 'MISSING_PRIVATE_KEY_FOR_LOCK'
      }
    }
  ]

  t.ok(loggerStubs.debug.calledWithMatch('No existing private key found for DOTENV_PRIVATE_KEY; adding an error'), 'logger.debug suggests private key could not be found')
  t.ok(!writeFileXStub.called, 'writeFileX not called')
  t.same(processedEnvs, expectedProcessedEnvs)

  ct.end()
})

// =================================================================================================================
t.test('#lock service - .env.keys path calculated - OK', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = undefined
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  const fakeReadFileFn = (filename) => {
    logger.debug('readFileSync/readFileX called with args:', filename)
    if (/** @type {string} */ (filename).endsWith('.keys')) {
      return privateKeyFileContents
    } else {
      return publicKeyFileContents
    }
  }

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fs, 'readFileSync').callsFake(fakeReadFileFn)
  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(fakeReadFileFn)
  // existsSync will always return true
  sinon.stub(fsx, 'existsSync').callsFake((...args) => { logger.debug('existsSync called with args:', ...args); return true })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns(['.env.keys', envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  const expectedProcessedEnvs = [
    {
      type: 'envFile',
      filepath: `${originalPWD}/.env`,
      changed: true,
      locked: true,
      originalValue: 'my_private_key',
      envKeysFilepath: '.env.keys',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      envFilepath: '.env'
    }
  ]

  t.ok(writeFileXStub.calledWithMatch(`${originalPWD}/.env.keys`, /^DOTENV_PRIVATE_KEY=encrypted:/), 'writeFileX called with encrypted private key')
  t.same(processedEnvs, expectedProcessedEnvs)
  ct.end()
})

// =================================================================================================================
t.test('#lock service - .env.keys path calculated but does not exist', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = undefined
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  const fakeReadFileFn = (filename) => {
    logger.debug('readFileSync/readFileX called with args:', filename)
    if (/** @type {string} */ (filename).endsWith('.keys')) {
      return privateKeyFileContents
    } else {
      return publicKeyFileContents
    }
  }

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fs, 'readFileSync').callsFake(fakeReadFileFn)
  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(fakeReadFileFn)
  // existsSync says that .env.keys files do not exist
  sinon.stub(fsx, 'existsSync').callsFake((filepath) => { return !filepath.endsWith('.keys') })
  // readdirSync lists .env but not .env.keys
  sinon.stub(fsx, 'readdirSync').returns([envFile])

  const {
    processedEnvs
  } = new Lock([], envKeysFile, passPhrase, salt).run()

  const expectedProcessedEnvs = [
    {
      type: 'envFile',
      filepath: `${originalPWD}/.env`,
      changed: false,
      locked: false,
      error: {
        code: 'MISSING_PRIVATE_KEY_FOR_LOCK'
      }
    }
  ]

  t.ok(!writeFileXStub.called, 'writeFileX should not have been called')
  t.same(processedEnvs, expectedProcessedEnvs)
  ct.end()
})

// =================================================================================================================
t.test('#lock service - run (no arguments) gives MISSING_PRIVATE_KEY_FOR_LOCK error', ct => {
  // const passPhrase = 'myS3cr3tP@ssPhr@s3'
  // const salt = 'dotenvx_salt'

  const {
    processedEnvs
  } = new Lock().run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  const exampleError = new Error("[MISSING_PRIVATE_KEY_FOR_LOCK] could not find private key 'DOTENV_PRIVATE_KEY='")
  exampleError.code = 'MISSING_PRIVATE_KEY_FOR_LOCK'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: path.resolve('.env'),
    changed: false,
    locked: false,
    error: exampleError
  }])

  t.ok(loggerStubs.debug.calledWithMatch('Locking env key for .env'), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch(`Using private key name: DOTENV_PRIVATE_KEY; existingPrivateKey: null; envKeysFilepath: ${originalPWD}/.env.keys`), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch('No existing private key found for DOTENV_PRIVATE_KEY; adding an error'), 'logger.debug called')

  ct.end()
})

// =================================================================================================================
t.test('#lock service - fs.detectEncoding throws an error', ct => {
  const passPhrase = 'myS3cr3tP@ssPhr@s3'
  const salt = 'dotenvx_salt'
  const envFile = '.env'
  const envKeysFile = '.env.keys'
  const privateKeyFileContents = 'DOTENV_PRIVATE_KEY=my_private_key'
  const publicKeyFileContents = 'DOTENV_PUBLIC_KEY=whatever'

  const fakeReadFileFn = (filename) => {
    logger.debug('readFileSync/readFileX called with args:', filename)
    if (/** @type {string} */ (filename).endsWith('.keys')) {
      return privateKeyFileContents
    } else {
      return publicKeyFileContents
    }
  }

  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fs, 'readFileSync').callsFake(fakeReadFileFn)
  // here are the contents of our fake .env and .env.keys files
  sinon.stub(fsx, 'readFileX').callsFake(fakeReadFileFn)
  const inst = new Lock([], envKeysFile, passPhrase, salt)
  const err = new Error('fake error')
  err.code = 'FAKE_ERROR'
  sinon.stub(inst, '_detectEncoding').throws(err)

  // existsSync will always return true
  sinon.stub(fsx, 'existsSync').callsFake((...args) => { logger.debug('existsSync called with args:', ...args); return true })
  // readdirSync will always list our fake .env and .env.keys files
  sinon.stub(fsx, 'readdirSync').returns([envKeysFile, envFile])

  const {
    processedEnvs
  } = inst.run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)
  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: path.resolve('.env'),
    locked: false,
    changed: false,
    error: {
      code: 'FAKE_ERROR'
    }
  }])
  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvs
  } = new Lock().run()

  t.debug(`processedEnvs: ${JSON.stringify(processedEnvs, null, 2)}`)

  const exampleError = new Error("[MISSING_PRIVATE_KEY_FOR_LOCK] could not find private key 'DOTENV_PRIVATE_KEY='")
  exampleError.code = 'MISSING_PRIVATE_KEY_FOR_LOCK'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: path.resolve('.env'),
    changed: false,
    locked: false,
    error: exampleError
  }])

  t.ok(loggerStubs.debug.calledWithMatch('Locking env key for .env'), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch(`Using private key name: DOTENV_PRIVATE_KEY; existingPrivateKey: null; envKeysFilepath: ${originalPWD}/.env.keys`), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch('No existing private key found for DOTENV_PRIVATE_KEY; adding an error'), 'logger.debug called')

  ct.end()
})
// =================================================================================================================

t.test('#run (no arguments and some other error)', ct => {
  const readFileXStub = sinon.stub(fsx, 'readFileX').throws(new Error('Mock Error'))

  const inst = new Lock()
  const detectEncodingStub = sinon.stub(inst, '_detectEncoding').returns('utf8')

  const {
    processedEnvs
  } = inst.run()

  const exampleError = new Error("[MISSING_PRIVATE_KEY_FOR_LOCK] could not find private key 'DOTENV_PRIVATE_KEY='")
  exampleError.code = 'MISSING_PRIVATE_KEY_FOR_LOCK'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: path.resolve('.env'),
    locked: false,
    changed: false,
    error: exampleError
  }])

  readFileXStub.restore()
  detectEncodingStub.restore()
  t.ok(loggerStubs.debug.calledWithMatch('Locking env key for .env'), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch(`Using private key name: DOTENV_PRIVATE_KEY; existingPrivateKey: null; envKeysFilepath: ${originalPWD}/.env.keys`), 'logger.debug called')
  t.ok(loggerStubs.debug.calledWithMatch('No existing private key found for DOTENV_PRIVATE_KEY; adding an error'), 'logger.debug called')

  ct.end()
})
