const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')

const Sets = require('../../../src/lib/services/sets')

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
    changedFilepaths
  } = new Sets().run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    key: null,
    value: null,
    type: 'envFile',
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvs,
    changedFilepaths
  } = new Sets().run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    key: null,
    value: null,
    type: 'envFile',
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileXStub = sinon.stub(fsx, 'readFileX').throws(new Error('Mock Error'))

  const inst = new Sets()
  const detectEncodingStub = sinon.stub(inst, '_detectEncoding').returns('utf8')

  const {
    processedEnvs,
    changedFilepaths
  } = inst.run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvs, [{
    key: null,
    value: null,
    type: 'envFile',
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  readFileXStub.restore()
  detectEncodingStub.restore()

  ct.end()
})

t.test('#run (encrypt off) (finds .env file)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    'KEY="value"'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('KEY', 'value', envs, false).run()

  ct.same(processedEnvs, [{
    key: 'KEY',
    value: 'value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file and overwrites existing key/value)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="new value" # this is a comment'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs, false).run()

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    originalValue: 'frontend',
    changed: true,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file and attempts overwrite with same key/value)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = new Sets('HELLO', 'frontend', envs, false).run()

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'frontend',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: false,
    originalValue: 'frontend',
    envSrc
  }])
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file as array)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    'KEY="value"'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('KEY', 'value', envs, false).run()

  ct.same(processedEnvs, [{
    key: 'KEY',
    value: 'value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (finds .env file) with --encrypt', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('KEY', 'value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyAdded = row.privateKeyAdded
  const envKeysFilepath = row.envKeysFilepath
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    `KEY="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'KEY',
    value: 'value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    encryptedValue,
    publicKey,
    privateKey,
    envKeysFilepath,
    privateKeyAdded,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (finds .env and .env.keys file) with --encrypt', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('KEY', 'value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    'HELLO="encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=="',
    `KEY="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'KEY',
    value: 'value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: true,
    originalValue: null,
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  ct.end()
})

t.test('#run (finds .env and .env.keys file) with --encrypt and changes original value', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    `HELLO="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: true,
    originalValue: 'encrypted',
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  ct.end()
})

t.test('#run (finds .env and .env.keys file) with --encrypt but derived public key does not match configured public key', ct => {
  process.env.DOTENV_PUBLIC_KEY = '12345'

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs
  } = new Sets('HELLO', 'new value', envs).run()

  const error = new Error('derived public key (03eaf21…) does not match the existing public key (12345…)')
  error.code = 'INVALID_DOTENV_PRIVATE_KEY'
  error.help = 'debug info: DOTENV_PRIVATE_KEY=ec9e800… (derived DOTENV_PUBLIC_KEY=03eaf21… vs existing DOTENV_PUBLIC_KEY=12345…)'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: false,
    originalValue: 'encrypted',
    error
  }])

  ct.end()
})

t.test('#run (finds .env file only) with --encrypt', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    const { key } = this
    // Custom logic depending on constructor arguments
    if (key === 'DOTENV_PUBLIC_KEY') {
      return '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba'
    }
    return null
  })

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    `HELLO="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: true,
    originalValue: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA==',
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  sandbox.restore()

  ct.end()
})

t.test('#run (finds .env and .env.keys file but they are blank) with --encrypt', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    return null
  })

  const readFileXStub = sinon.stub(fsx, 'readFileX').returns('')

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    `HELLO="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: true,
    originalValue: null,
    privateKeyAdded: true,
    envKeysFilepath: 'tests/monorepo/apps/encrypted/.env.keys',
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  sandbox.restore()
  readFileXStub.restore()

  ct.end()
})

t.test('#run (finds .env and .env.keys file but they are not quite blank) with --encrypt', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    return null
  })

  const readFileXStub = sinon.stub(fsx, 'readFileX').returns('## hi')

  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    '## hi',
    `HELLO="${encryptedValue}"`
  ].join('\n')

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
    envFilepath: 'tests/monorepo/apps/encrypted/.env',
    changed: true,
    originalValue: null,
    privateKeyAdded: true,
    envKeysFilepath: 'tests/monorepo/apps/encrypted/.env.keys',
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

  sandbox.restore()
  readFileXStub.restore()

  ct.end()
})

t.test('#run (finds .env with a shebang) with --encrypt', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    return null
  })

  const envFile = 'tests/monorepo/apps/shebang/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envs).run()

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#!/bin/bash',
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    `HELLO="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'new value',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/shebang/.env'),
    envFilepath: 'tests/monorepo/apps/shebang/.env',
    envKeysFilepath: 'tests/monorepo/apps/shebang/.env.keys',
    changed: true,
    originalValue: 'shebang',
    privateKeyAdded: true,
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/shebang/.env'])

  sandbox.restore()

  ct.end()
})

t.test('#run (finds .env file only) with --encrypt AND setting from unencrypted to encrypted same value', ct => {
  const Keypair = require('../../../src/lib/services/keypair')
  const sandbox = sinon.createSandbox()
  sandbox.stub(Keypair.prototype, 'run').callsFake(function () {
    const { key } = this
    // Custom logic depending on constructor arguments
    if (key === 'DOTENV_PUBLIC_KEY') {
      return '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba'
    }
    return null
  })

  const envFile = 'tests/monorepo/apps/unencrypted/.env'
  const envs = [
    { type: 'envFile', value: envFile }
  ]

  const {
    processedEnvs,
    changedFilepaths
  } = new Sets('HELLO', 'unencrypted', envs).run() // this value should be the same value as currently in the file

  const row = processedEnvs[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    `HELLO="${encryptedValue}"`
  ].join('\n') + '\n'

  ct.same(processedEnvs, [{
    key: 'HELLO',
    value: 'unencrypted',
    type: 'envFile',
    filepath: path.resolve('tests/monorepo/apps/unencrypted/.env'),
    envFilepath: 'tests/monorepo/apps/unencrypted/.env',
    changed: true,
    originalValue: 'unencrypted',
    publicKey,
    privateKey,
    encryptedValue,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/unencrypted/.env'])

  sandbox.restore()

  ct.end()
})
