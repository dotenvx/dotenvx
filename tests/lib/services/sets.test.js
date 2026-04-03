const t = require('tap')
const fs = require('fs')
const fsx = require('../../../src/lib/helpers/fsx')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Sets = require('../../../src/lib/services/sets')

let writeFileXStub
const ROOT_DIR = path.resolve(__dirname, '../../..')
const ROOT_ENV_FILE = path.join(ROOT_DIR, '.env')
const ROOT_ENV_KEYS_FILE = path.join(ROOT_DIR, '.env.keys')

function cleanupRootEnvFiles () {
  if (fs.existsSync(ROOT_ENV_FILE)) {
    fs.unlinkSync(ROOT_ENV_FILE)
  }
  if (fs.existsSync(ROOT_ENV_KEYS_FILE)) {
    fs.unlinkSync(ROOT_ENV_KEYS_FILE)
  }
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  cleanupRootEnvFiles()

  writeFileXStub = sinon.stub(fsx, 'writeFileXSync')
})

t.afterEach((ct) => {
  writeFileXStub.restore()
  cleanupRootEnvFiles()
})

t.test('#run (no arguments)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-sets-cwd-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets().run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

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

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (encrypt off) creates missing .env with only the set key/value',
  async ct => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-sets-'))
    const envFile = path.join(tmpdir, '.env')
    const envs = [{ type: 'envFile', value: envFile }]
    writeFileXStub.callsFake((filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Sets('HELLO', 'world', envs, false, null, false, false).run()

    ct.equal(processedEnvs.length, 1)
    ct.notOk(processedEnvs[0].error)
    ct.equal(processedEnvs[0].changed, true)
    ct.equal(processedEnvs[0].envSrc, 'HELLO="world"\n')
    ct.same(changedFilepaths, [envFile])
    ct.same(unchangedFilepaths, [])

    ct.end()
  })

t.test('#run (encrypt on) creates missing .env and encrypts the set key/value',
  async ct => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-sets-'))
    const envFile = path.join(tmpdir, '.env')
    const envs = [{ type: 'envFile', value: envFile }]
    writeFileXStub.callsFake((filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Sets('HELLO', 'world', envs, true, null, false, false).run()

    ct.equal(processedEnvs.length, 1)
    ct.notOk(processedEnvs[0].error)
    ct.equal(processedEnvs[0].changed, true)
    ct.ok(processedEnvs[0].privateKeyAdded)
    ct.match(processedEnvs[0].envSrc, /^#\/-------------------\[DOTENV_PUBLIC_KEY\]--------------------\//)
    ct.match(processedEnvs[0].envSrc, /HELLO="encrypted:/)
    ct.same(changedFilepaths, [envFile])
    ct.same(unchangedFilepaths, [])

    ct.end()
  })

t.test('#run (encrypt off) with --no-create on missing .env returns missing file error',
  async ct => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-sets-'))
    const envFile = path.join(tmpdir, '.env')
    const envs = [{ type: 'envFile', value: envFile }]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Sets('HELLO', 'world', envs, false, null, false, true).run()

    ct.equal(processedEnvs.length, 1)
    ct.equal(processedEnvs[0].error.code, 'MISSING_ENV_FILE')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])

    ct.end()
  })

t.test('#run (no env file)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-sets-cwd-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets().run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

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

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no arguments and some other error)',
  async ct => {
    const readFileXStub = sinon.stub(fsx, 'readFileXSync').throws(new Error('Mock Error'))
    const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns(Buffer.from('HELLO=world\n'))

    const inst = new Sets()

    const {
      processedEnvs,
      changedFilepaths
    } = await inst.run()

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
    readFileSyncStub.restore()

    ct.end()
  })

t.test('#run (encrypt off) (finds .env file)',
  async ct => {
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
    } = await new Sets('KEY', 'value', envs, false).run()

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

t.test('#run (encrypt off) (finds .env file and overwrites existing key/value)',
  async ct => {
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
    } = await new Sets('HELLO', 'new value', envs, false).run()

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

t.test('#run (encrypt off) (finds .env file and attempts overwrite with same key/value)',
  async ct => {
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
    } = await new Sets('HELLO', 'frontend', envs, false).run()

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

t.test('#run (encrypt off) (finds .env file as array)',
  async ct => {
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
    } = await new Sets('KEY', 'value', envs, false).run()

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

t.test('#run (finds .env file) with --encrypt',
  async ct => {
    const envFile = 'tests/monorepo/apps/frontend/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('KEY', 'value', envs).run()

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

t.test('#run (finds .env and .env.keys file) with --encrypt',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('KEY', 'value', envs).run()

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

t.test('#run (finds .env and .env.keys file) with --encrypt and changes original value',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'new value', envs).run()

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

t.test('#run (finds .env and .env.keys file) with --encrypt but derived public key does not match configured public key',
  async ct => {
    process.env.DOTENV_PUBLIC_KEY = '12345'

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs
    } = await new Sets('HELLO', 'new value', envs).run()

    const error = new Error('[MISPAIRED_PRIVATE_KEY] private key\'s derived public key (03eaf21…) does not match the existing public key (12345…)')
    error.code = 'MISPAIRED_PRIVATE_KEY'
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/752]'
    error.messageWithHelp = '[MISPAIRED_PRIVATE_KEY] private key\'s derived public key (03eaf21…) does not match the existing public key (12345…). fix: [https://github.com/dotenvx/dotenvx/issues/752]'

    ct.same(processedEnvs, [{
      key: 'HELLO',
      value: 'new value',
      type: 'envFile',
      filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
      envFilepath: 'tests/monorepo/apps/encrypted/.env',
      changed: false,
      originalValue: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA==',
      error
    }])

    ct.end()
  })

t.test('#run (finds .env file only) with --encrypt',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'new value', envs).run()

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

t.test('#run (finds .env and .env.keys file but they are blank) with --encrypt',
  async ct => {
    const Keypair = require('../../../src/lib/services/keypair')
    const sandbox = sinon.createSandbox()
    sandbox.stub(Keypair.prototype, 'runSync').callsFake(function () {
      return {}
    })
    const readFileXStub = sinon.stub(fsx, 'readFileXSync').returns('')

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'new value', envs).run()

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

t.test('#run (finds .env and .env.keys file but they are not quite blank) with --encrypt',
  async ct => {
    const Keypair = require('../../../src/lib/services/keypair')
    const sandbox = sinon.createSandbox()
    sandbox.stub(Keypair.prototype, 'runSync').callsFake(function () {
      return {}
    })
    const readFileXStub = sinon.stub(fsx, 'readFileXSync').returns('## hi')

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'new value', envs).run()

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

t.test('#run (finds .env with a shebang) with --encrypt',
  async ct => {
    const Keypair = require('../../../src/lib/services/keypair')
    const sandbox = sinon.createSandbox()
    sandbox.stub(Keypair.prototype, 'runSync').callsFake(function () {
      return {}
    })

    const envFile = 'tests/monorepo/apps/shebang/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'new value', envs).run()

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

t.test('#run (finds .env file only) with --encrypt AND setting from unencrypted to encrypted same value',
  async ct => {
    const envFile = 'tests/monorepo/apps/unencrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('HELLO', 'unencrypted', envs).run() // this value should be the same value as currently in the file

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
      value: 'unencrypted',
      type: 'envFile',
      filepath: path.resolve('tests/monorepo/apps/unencrypted/.env'),
      envFilepath: 'tests/monorepo/apps/unencrypted/.env',
      changed: true,
      originalValue: 'unencrypted',
      privateKeyAdded: true,
      envKeysFilepath: 'tests/monorepo/apps/unencrypted/.env.keys',
      publicKey,
      privateKey,
      encryptedValue,
      privateKeyName,
      envSrc
    }])
    ct.same(changedFilepaths, ['tests/monorepo/apps/unencrypted/.env'])

    ct.end()
  })

t.test('#run (finds .env file) with --encrypt and custom envKeysFilepath',
  async ct => {
    const envKeysFilepath = 'tests/monorepo/.env.keys'
    const envFile = 'tests/monorepo/apps/app1/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('KEY', 'value', envs, true, envKeysFilepath).run()

    const row = processedEnvs[0]
    const publicKey = row.publicKey
    const privateKey = row.privateKey
    const privateKeyAdded = row.privateKeyAdded
    const privateKeyName = row.privateKeyName
    const encryptedValue = row.encryptedValue
    const envSrc = [
      '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
      '#/            public-key encryption for .env files          /',
      '#/       [how it works](https://dotenvx.com/encryption)     /',
      '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}" # -fk ../../.env.keys`,
    '',
    '# .env',
    '# for testing purposes only',
    'HELLO="app1"',
    `KEY="${encryptedValue}"`
    ].join('\n') + '\n'

    ct.same(processedEnvs, [{
      key: 'KEY',
      value: 'value',
      type: 'envFile',
      filepath: path.resolve('tests/monorepo/apps/app1/.env'),
      envFilepath: 'tests/monorepo/apps/app1/.env',
      changed: true,
      originalValue: null,
      encryptedValue,
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

t.test('#run (finds .env file) with --encrypt and custom envKeysFilepath and privateKey already exists',
  async ct => {
    const envKeysFilepath = 'tests/monorepo/.env.keys'
    const envFile = 'tests/monorepo/apps/app1/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Sets('KEY', 'value', envs, true, envKeysFilepath).run()

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
    `DOTENV_PUBLIC_KEY_PRODUCTION="${publicKey}" # -fk ../../.env.keys`,
    '',
    '# .env.production',
    '# for testing purposes only',
    'HELLO="production"',
    `KEY="${encryptedValue}"`
    ].join('\n') + '\n'

    ct.same(processedEnvs, [{
      key: 'KEY',
      value: 'value',
      type: 'envFile',
      filepath: path.resolve('tests/monorepo/apps/app1/.env.production'),
      envFilepath: 'tests/monorepo/apps/app1/.env.production',
      changed: true,
      originalValue: null,
      encryptedValue,
      publicKey,
      privateKey,
      privateKeyName,
      envSrc
    }])
    ct.same(changedFilepaths, ['tests/monorepo/apps/app1/.env.production'])

    ct.end()
  })

t.test('#run (finds .env file) with --encrypt and existing public key only',
  async ct => {
    const sandbox = sinon.createSandbox()
    const keyValuesStub = sandbox.stub().returns({
      publicKeyValue: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      privateKeyValue: null
    })
    const keyNames = require('../../../src/lib/helpers/keyResolution/keyNames')

    const SetsWithStub = proxyquire('../../../src/lib/services/sets', {
      './../helpers/keyResolution': {
        keyNames,
        keyValuesSync: keyValuesStub
      }
    })

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [{ type: 'envFile', value: envFile }]

    const { processedEnvs, changedFilepaths } = await new SetsWithStub('KEY', 'value', envs, true).run()

    ct.equal(processedEnvs[0].publicKey, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')
    ct.equal(processedEnvs[0].privateKey, undefined)
    ct.equal(processedEnvs[0].changed, true)
    ct.match(processedEnvs[0].encryptedValue, /^encrypted:/)
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

    sandbox.restore()
    ct.end()
  })

t.test('#run wraps invalid public key encryption errors',
  async ct => {
    const cryptography = require('../../../src/lib/helpers/cryptography')
    const SetsWithStub = proxyquire('../../../src/lib/services/sets', {
      './../helpers/cryptography': {
        ...cryptography,
        encryptValue: () => {
          throw new Error('padded hex string expected, got unpadded hex of length 67')
        }
      }
    })

    const envFile = 'tests/monorepo/apps/frontend/.env'
    const envs = [{ type: 'envFile', value: envFile }]

    const { processedEnvs, changedFilepaths } = await new SetsWithStub('KEY', 'value', envs, true).run()

    ct.equal(processedEnvs[0].error.code, 'INVALID_PUBLIC_KEY')
    ct.match(processedEnvs[0].error.message, /^\[INVALID_PUBLIC_KEY\] could not encrypt using public key 'DOTENV_PUBLIC_KEY=/)
    ct.equal(processedEnvs[0].error.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/756]')
    ct.same(changedFilepaths, [])

    ct.end()
  })
