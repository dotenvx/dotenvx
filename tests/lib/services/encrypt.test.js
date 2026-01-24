const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const dotenvParse = require('../../../src/lib/helpers/dotenvParse')

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
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt().run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
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
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt().run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
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

  const inst = new Encrypt()
  const detectEncodingStub = sinon.stub(inst, '_detectEncoding').returns('utf8')

  const {
    processedEnvs,
    changedFilepaths
  } = inst.run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  readFileXStub.restore()
  detectEncodingStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/frontend/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file with multiline values - implicit and explicit newline)', ct => {
  const envFile = 'tests/monorepo/apps/multiline/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO', 'ALOHA'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiline/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiline/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'ALOHA'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.ALOHA, /^encrypted:/, 'ALOHA should start with "encrypted:"')

  const output = `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="${parsed.DOTENV_PUBLIC_KEY}"

# .env
HELLO="${parsed.HELLO}"
ALOHA="${parsed.ALOHA}"
`
  ct.same(p1.envSrc, output)

  ct.end()
})

t.test('#run (finds .env file with CRLF multiline values - implicit and explicit CRLF newline)', ct => {
  const envFile = 'tests/monorepo/apps/multiline/.env.crlf'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO', 'ALOHA'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiline/.env.crlf')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiline/.env.crlf'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_CRLF', 'HELLO', 'ALOHA'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_CRLF, 'DOTENV_PUBLIC_KEY_CRLF should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.ALOHA, /^encrypted:/, 'ALOHA should start with "encrypted:"')

  const output = `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY_CRLF="${parsed.DOTENV_PUBLIC_KEY_CRLF}"

# .env.crlf
HELLO="${parsed.HELLO}"\r
ALOHA="${parsed.ALOHA}"\r
`
  ct.same(p1.envSrc, output)

  ct.end()
})

t.test('#run (finds .env file already encrypted)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, [])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  ct.end()
})

t.test('#run (finds .env file with specified key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, ['HELLO2']).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file with specified key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, 'HELLO2').run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file with specified glob string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, 'H*').run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO', 'HELLO2', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO2 should start with "encrypted:"')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file excluding specified key)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, [], ['HELLO2']).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO', 'HELLO3'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should not be encrypted')
  ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should start with "encrypted:"')

  ct.end()
})

t.test('#run (finds .env file excluding specified key as string)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, [], 'HELLO3').run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['HELLO', 'HELLO2'])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')
  ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO2 should start with "encrypted:"')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should not be encrypted')

  ct.end()
})

t.test('#run (finds .env file excluding specified key globbed)', ct => {
  const envFile = 'tests/monorepo/apps/multiple/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs, [], 'HE*').run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, [])
  ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env')
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/multiple/.env'])
  const parsed = dotenvParse(p1.envSrc)

  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO', 'HELLO2', 'HELLO3'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.HELLO, 'one', 'HELLO should not be encrypted')
  ct.match(parsed.HELLO2, 'two', 'HELLO2 should not be encrypted')
  ct.match(parsed.HELLO3, 'three', 'HELLO3 should not be encrypted')

  ct.end()
})

t.test('#run (finds .env.export file with exported key)', ct => {
  const envFile = 'tests/.env.export'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['KEY'])
  ct.same(p1.envFilepath, 'tests/.env.export')
  ct.same(changedFilepaths, ['tests/.env.export'])
  ct.same(unchangedFilepaths, [])

  const parsed = dotenvParse(p1.envSrc)

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
export KEY=${parsed.KEY}
`
  ct.same(p1.envSrc, output)

  ct.end()
})

t.test('#run (finds .env and .env.keys file) but derived public key does not match configured public key', ct => {
  process.env.DOTENV_PUBLIC_KEY = '12345'

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs
  } = new Encrypt(envs).run()

  const error = new Error('derived public key (03eaf21…) does not match the existing public key (12345…)')
  error.code = 'INVALID_DOTENV_PRIVATE_KEY'
  error.help = 'debug info: DOTENV_PRIVATE_KEY=ec9e800… (derived DOTENV_PUBLIC_KEY=03eaf21… vs existing DOTENV_PUBLIC_KEY=12345…)'

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    error
  }])

  ct.end()
})

t.test('#run (finds .env file only)', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    return { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba' }
  })

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const envSrc = row.envSrc

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    publicKey,
    privateKey,
    privateKeyName,
    envSrc
  }])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  sandbox.restore()

  ct.end()
})

t.test('#run (finds .env file) and custom envKeysFilepath', ct => {
  const envKeysFilepath = 'tests/monorepo/.env.keys'
  const envFile = 'tests/monorepo/apps/app1/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Encrypt(envs, [], [], envKeysFilepath).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyAdded = row.privateKeyAdded
  const privateKeyName = row.privateKeyName
  const envSrc = row.envSrc

  ct.same(processedEnvs, [{
    keys: ['HELLO'],
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/app1/.env'),
    envFilepath: 'tests/monorepo/apps/app1/.env',
    changed: true,
    publicKey,
    privateKey,
    envKeysFilepath: 'tests/monorepo/.env.keys',
    privateKeyAdded,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/app1/.env'])

  ct.end()
})

t.test('#run (finds .env file) and custom envKeysFilepath and privateKey already exists', ct => {
  const envKeysFilepath = 'tests/monorepo/.env.keys'
  const envFile = 'tests/monorepo/apps/app1/.env.production'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Encrypt(envs, [], [], envKeysFilepath).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const envSrc = row.envSrc

  ct.same(processedEnvs, [{
    keys: ['HELLO'],
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/app1/.env.production'),
    envFilepath: 'tests/monorepo/apps/app1/.env.production',
    changed: true,
    publicKey,
    privateKey,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/app1/.env.production'])

  ct.end()
})

t.test('#run (finds .env file only AND only the existing public key not the private key)', ct => {
  const sandbox = sinon.createSandbox()

  const stubbedFindPrivateKey = sandbox.stub().returns(null)

  // Load Encrypt with the stub injected
  const Encrypt = proxyquire('../../../src/lib/services/encrypt', {
    './../helpers/findPrivateKey': { findPrivateKey: stubbedFindPrivateKey }
  })

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    unchangedFilepaths
  } = new Encrypt(envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const envSrc = row.envSrc

  ct.same(processedEnvs, [{
    keys: [],
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    publicKey,
    privateKey,
    privateKeyName,
    envSrc
  }])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  sandbox.restore()

  ct.end()
})

t.test('#run (finds .env file with @dotenvx-skip inline comment)', ct => {
  const sandbox = sinon.createSandbox()
  
  const envFileContent = `ENCRYPT_ME=secret123
SKIP_ME=plaintext456 # @dotenvx-skip
ALSO_ENCRYPT=another_secret
ALSO_SKIP=keep_plain # @dotenvx-skip comment with more text
`
  
  const readFileXStub = sandbox.stub(fsx, 'readFileX').returns(envFileContent)
  const existsSyncStub = sandbox.stub(fsx, 'existsSync').returns(false)
  
  const envFile = '.env.skiptest'
  const envs = [
    { type: 'envFile', value: envFile }
  ]
  
  const inst = new Encrypt(envs)
  const detectEncodingStub = sandbox.stub(inst, '_detectEncoding').returns('utf8')
  
  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = inst.run()
  
  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['ENCRYPT_ME', 'ALSO_ENCRYPT'], 'only non-skipped keys should be encrypted')
  ct.same(p1.envFilepath, '.env.skiptest')
  ct.same(changedFilepaths, ['.env.skiptest'])
  ct.same(unchangedFilepaths, [])
  
  const parsed = dotenvParse(p1.envSrc)
  
  ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_SKIPTEST', 'ENCRYPT_ME', 'SKIP_ME', 'ALSO_ENCRYPT', 'ALSO_SKIP'])
  ct.ok(parsed.DOTENV_PUBLIC_KEY_SKIPTEST, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.ENCRYPT_ME, /^encrypted:/, 'ENCRYPT_ME should be encrypted')
  ct.same(parsed.SKIP_ME, 'plaintext456', 'SKIP_ME should not be encrypted due to @dotenvx-skip')
  ct.match(parsed.ALSO_ENCRYPT, /^encrypted:/, 'ALSO_ENCRYPT should be encrypted')
  ct.same(parsed.ALSO_SKIP, 'keep_plain', 'ALSO_SKIP should not be encrypted due to @dotenvx-skip')
  
  sandbox.restore()
  
  ct.end()
})

t.test('#run (finds .env file with @dotenvx-skip combined with --exclude-key)', ct => {
  const sandbox = sinon.createSandbox()
  
  const envFileContent = `ENCRYPT_ME=secret123
SKIP_ME=plaintext456 # @dotenvx-skip
EXCLUDE_ME=excluded789
ALSO_ENCRYPT=another_secret
`
  
  const readFileXStub = sandbox.stub(fsx, 'readFileX').returns(envFileContent)
  const existsSyncStub = sandbox.stub(fsx, 'existsSync').returns(false)
  
  const envFile = '.env.combined'
  const envs = [
    { type: 'envFile', value: envFile }
  ]
  
  const inst = new Encrypt(envs, [], ['EXCLUDE_ME'])
  const detectEncodingStub = sandbox.stub(inst, '_detectEncoding').returns('utf8')
  
  const {
    processedEnvs,
    changedFilepaths
  } = inst.run()
  
  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['ENCRYPT_ME', 'ALSO_ENCRYPT'], 'only non-skipped and non-excluded keys should be encrypted')
  
  const parsed = dotenvParse(p1.envSrc)
  
  ct.ok(parsed.DOTENV_PUBLIC_KEY_COMBINED, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.ENCRYPT_ME, /^encrypted:/, 'ENCRYPT_ME should be encrypted')
  ct.same(parsed.SKIP_ME, 'plaintext456', 'SKIP_ME should not be encrypted due to @dotenvx-skip')
  ct.same(parsed.EXCLUDE_ME, 'excluded789', 'EXCLUDE_ME should not be encrypted due to --exclude-key')
  ct.match(parsed.ALSO_ENCRYPT, /^encrypted:/, 'ALSO_ENCRYPT should be encrypted')
  
  sandbox.restore()
  
  ct.end()
})

t.test('#run (finds .env file with @dotenvx-skip and URL containing # fragment)', ct => {
  const sandbox = sinon.createSandbox()
  
  const envFileContent = `ENCRYPT_URL="https://example.com/page#section"
SKIP_URL="https://api.example.com/endpoint#fragment" # @dotenvx-skip
ENCRYPT_URL_WITH_QUERY="https://example.com?param=value#anchor"
SKIP_COMPLEX_URL="https://user:pass@example.com:8080/path?query=1#hash" # @dotenvx-skip
`
  
  const readFileXStub = sandbox.stub(fsx, 'readFileX').returns(envFileContent)
  const existsSyncStub = sandbox.stub(fsx, 'existsSync').returns(false)
  
  const envFile = '.env.urls'
  const envs = [
    { type: 'envFile', value: envFile }
  ]
  
  const inst = new Encrypt(envs)
  const detectEncodingStub = sandbox.stub(inst, '_detectEncoding').returns('utf8')
  
  const {
    processedEnvs,
    changedFilepaths
  } = inst.run()
  
  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['ENCRYPT_URL', 'ENCRYPT_URL_WITH_QUERY'], 'only non-skipped URL keys should be encrypted')
  
  const parsed = dotenvParse(p1.envSrc)
  
  ct.ok(parsed.DOTENV_PUBLIC_KEY_URLS, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.ENCRYPT_URL, /^encrypted:/, 'ENCRYPT_URL should be encrypted')
  ct.same(parsed.SKIP_URL, 'https://api.example.com/endpoint#fragment', 'SKIP_URL should not be encrypted and preserve # in URL')
  ct.match(parsed.ENCRYPT_URL_WITH_QUERY, /^encrypted:/, 'ENCRYPT_URL_WITH_QUERY should be encrypted')
  ct.same(parsed.SKIP_COMPLEX_URL, 'https://user:pass@example.com:8080/path?query=1#hash', 'SKIP_COMPLEX_URL should not be encrypted and preserve # in URL')
  
  sandbox.restore()
  
  ct.end()
})

t.test('#run (finds .env file with @dotenvx-skip and empty string values)', ct => {
  const sandbox = sinon.createSandbox()
  
  const envFileContent = `ENCRYPT_EMPTY=""
SKIP_EMPTY="" # @dotenvx-skip
ENCRYPT_VALUE="something"
SKIP_EMPTY_UNQUOTED= # @dotenvx-skip
`
  
  const readFileXStub = sandbox.stub(fsx, 'readFileX').returns(envFileContent)
  const existsSyncStub = sandbox.stub(fsx, 'existsSync').returns(false)
  
  const envFile = '.env.empty'
  const envs = [
    { type: 'envFile', value: envFile }
  ]
  
  const inst = new Encrypt(envs)
  const detectEncodingStub = sandbox.stub(inst, '_detectEncoding').returns('utf8')
  
  const {
    processedEnvs,
    changedFilepaths
  } = inst.run()
  
  const p1 = processedEnvs[0]
  ct.same(p1.keys, ['ENCRYPT_EMPTY', 'ENCRYPT_VALUE'], 'only non-skipped keys should be encrypted, including empty values')
  
  const parsed = dotenvParse(p1.envSrc)
  
  ct.ok(parsed.DOTENV_PUBLIC_KEY_EMPTY, 'DOTENV_PUBLIC_KEY should not be empty')
  ct.match(parsed.ENCRYPT_EMPTY, /^encrypted:/, 'ENCRYPT_EMPTY should be encrypted even though empty')
  ct.same(parsed.SKIP_EMPTY, '', 'SKIP_EMPTY should remain empty and not be encrypted')
  ct.match(parsed.ENCRYPT_VALUE, /^encrypted:/, 'ENCRYPT_VALUE should be encrypted')
  ct.same(parsed.SKIP_EMPTY_UNQUOTED, '', 'SKIP_EMPTY_UNQUOTED should remain empty and not be encrypted')
  
  sandbox.restore()
  
  ct.end()
})
