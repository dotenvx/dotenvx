const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Run = require('../../../src/lib/services/run')
const { determine } = require('../../../src/lib/helpers/envResolution')

function runWithDefaults (envs = [], overload = false) {
  return new Run(determine(envs, process.env), overload)
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults().run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    }])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no arguments and some other error)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const readFileStub = sinon.stub(fs.promises, 'readFile').rejects(new Error('Mock Error'))

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults().run()

    const exampleError = new Error('Mock Error')

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    }])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, [])

    readFileStub.restore()
    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no arguments and fsx readFileX throws)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const RunWithReadError = proxyquire('../../../src/lib/services/run', {
      './../helpers/detectEncoding': async () => 'utf8',
      './../helpers/fsx': {
        readFileX: async () => {
          throw new Error('Mock Error')
        }
      }
    })

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await new RunWithReadError(determine([], process.env)).run()

    const exampleError = new Error('Mock Error')

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    }])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: {
        HELLO: 'frontend'
      },
      injected: {
        HELLO: 'frontend'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

t.test('#run (encrypted .env finds .env.keys next to itself)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/encrypted/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1',
      src: fs.readFileSync('tests/monorepo/apps/encrypted/.env').toString(),
      parsed: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted'
      },
      injected: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

    ct.end()
  })

t.test('#run (encrypted .env with bad private key)',
  async ct => {
    process.env.DOTENV_PRIVATE_KEY = 'bad-private-key'

    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    const error = new Error('[INVALID_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=bad-pri…\'')
    error.code = 'INVALID_PRIVATE_KEY'
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/465]'
    error.messageWithHelp = '[INVALID_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=bad-pri…\'. fix: [https://github.com/dotenvx/dotenvx/issues/465]'

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/encrypted/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'bad-private-key',
      src: fs.readFileSync('tests/monorepo/apps/encrypted/.env').toString(),
      parsed: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=='
      },
      errors: [error],
      injected: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=='
      },
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

    ct.end()
  })

t.test('#run when DOTENV_PRIVATE_KEY set but envs is not set',
  async ct => {
    const originalDirectory = process.cwd()

    process.env.DOTENV_PRIVATE_KEY = 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1'

    // change to the tests/monorepo/apps/encrypted directory to simulate correctly
    process.chdir('tests/monorepo/apps/encrypted')

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults().run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: '.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1',
      src: fs.readFileSync('.env').toString(),
      parsed: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted'
      },
      injected: {
        DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
        HELLO: 'encrypted'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['.env'])
    ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

    process.chdir(originalDirectory)

    ct.end()
  })

t.test('#run (finds .env file) with already falsy value',
  async ct => {
    process.env.HELLO = '' // falsy value

    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: {
        HELLO: ''
      },
      injected: {},
      errors: [],
      preExisted: {
        HELLO: ''
      }
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, [])

    ct.end()
  })

t.test('#run (finds .env file as array)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]
    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: {
        HELLO: 'frontend'
      },
      injected: {
        HELLO: 'frontend'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

t.test('#run (finds .env file but HELLO already exists)',
  async ct => {
    process.env.HELLO = 'World'

    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: {
        HELLO: 'World'
      },
      injected: {},
      errors: [],
      preExisted: {
        HELLO: 'World'
      }
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, [])

    ct.end()
  })

t.test('#run (finds .env file but HELLO already exists but overload is on)',
  async ct => {
    process.env.HELLO = 'World'

    const envs = [
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs, true).run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: {
        HELLO: 'frontend'
      },
      injected: {
        HELLO: 'frontend'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

t.test('#run (command substitution)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.eval' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [{
      type: 'envFile',
      filepath: 'tests/.env.eval',
      privateKeyName: 'DOTENV_PRIVATE_KEY_EVAL',
      privateKey: null,
      src: fs.readFileSync('tests/.env.eval').toString(),
      parsed: {
        HELLO: 'world'
      },
      injected: {
        HELLO: 'world'
      },
      errors: [],
      preExisted: {}
    }])
    ct.same(readableFilepaths, ['tests/.env.eval'])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

t.test('#run (with envs as string)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)

    const envs = [
      { type: 'env', value: 'HELLO=string' }
    ]

    // it should still prepend a type 'envFile': value: '.env'
    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    ct.same(processedEnvs, [
      {
        type: 'envFile',
        filepath: '.env',
        errors: [exampleError]
      },
      {
        type: 'env',
        string: 'HELLO=string',
        privateKeyName: null,
        privateKey: null,
        parsed: {
          HELLO: 'string'
        },
        errors: [],
        injected: {
          HELLO: 'string'
        },
        preExisted: {}
      }
    ])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (with encrypted env string and privateKeyName)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)

    process.env.DOTENV_PRIVATE_KEY_PRODUCTION = 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c'
    const src = 'HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"'
    const envs = [
      { type: 'env', value: src, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    ct.same(processedEnvs, [
      {
        type: 'envFile',
        filepath: '.env',
        errors: [exampleError]
      },
      {
        type: 'env',
        string: src,
        privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
        privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c',
        parsed: {
          HELLO: 'World'
        },
        errors: [],
        injected: {
          HELLO: 'World'
        },
        preExisted: {}
      }
    ])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, ['HELLO'])
    ct.equal(process.env.HELLO, 'World')

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (with encrypted env string and privateKeyName reads .env.keys)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env.keys', 'DOTENV_PRIVATE_KEY_PRODUCTION="a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c"\n')

    const src = 'HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"'
    const envs = [
      { type: 'env', value: src, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await new Run(envs).run()

    ct.same(processedEnvs, [
      {
        type: 'env',
        string: src,
        privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
        privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c',
        parsed: {
          HELLO: 'World'
        },
        errors: [],
        injected: {
          HELLO: 'World'
        },
        preExisted: {}
      }
    ])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, ['HELLO'])
    ct.equal(process.env.HELLO, 'World')

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (with encrypted env string and missing privateKeyName value)',
  async ct => {
    const src = 'HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"'
    const envs = [
      { type: 'env', value: src, privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await new Run(envs).run()

    const error = new Error('[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY_PRODUCTION=\'')
    error.code = 'MISSING_PRIVATE_KEY'
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
    error.messageWithHelp = '[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY_PRODUCTION=\'. fix: [https://github.com/dotenvx/dotenvx/issues/464]'

    ct.same(processedEnvs, [
      {
        type: 'env',
        string: src,
        privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
        privateKey: null,
        parsed: {
          HELLO: 'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l'
        },
        errors: [error],
        injected: {
          HELLO: 'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l'
        },
        preExisted: {}
      }
    ])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

t.test('#run (with envs as string and errors somehow from inject)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)

    const envs = [
      { type: 'env', value: 'HELLO=string' }
    ]

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    const run = runWithDefaults(envs)
    const mockError = new Error('Mock Error')
    const injectStub = sinon.stub(run, 'inject').throws(mockError)

    const {
      processedEnvs
    } = await run.run()

    ct.same(processedEnvs, [
      {
        type: 'envFile',
        filepath: '.env',
        errors: [exampleError]
      },
      {
        type: 'env',
        string: 'HELLO=string',
        privateKeyName: null,
        privateKey: null,
        parsed: {
          HELLO: 'string'
        },
        errors: [mockError],
        injected: {
          HELLO: 'string'
        },
        preExisted: {}
      }
    ])

    injectStub.restore()
    process.chdir(cwd)

    ct.end()
  })

t.test('#run (mixed string and file)',
  async ct => {
    const envs = [
      { type: 'env', value: 'HELLO=string' },
      { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    ct.same(processedEnvs, [
      {
        type: 'env',
        string: 'HELLO=string',
        privateKeyName: null,
        privateKey: null,
        parsed: { HELLO: 'string' },
        injected: { HELLO: 'string' },
        errors: [],
        preExisted: {}
      },
      {
        type: 'envFile',
        filepath: 'tests/monorepo/apps/frontend/.env',
        privateKeyName: 'DOTENV_PRIVATE_KEY',
        privateKey: null,
        src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
        parsed: { HELLO: 'string' },
        injected: {},
        errors: [],
        preExisted: { HELLO: 'string' }
      }
    ])

    ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.same(uniqueInjectedKeys, ['HELLO'])

    ct.end()
  })

// https://github.com/dotenvx/dotenvx/issues/441
t.test('#run (kanaka scenario)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-run-'))
    process.chdir(tmpdir)

    const src = `# combined
# config1 definitions
options="$\{options} optA"
configX=blah
# config2 definitions
options="$\{options} optB optC $\{configX:+optX}"
# config3 definitions
options="$\{options} optD"`
    const envs = [
      { type: 'env', value: src }
    ]

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = await runWithDefaults(envs).run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

    ct.same(processedEnvs, [
      {
        type: 'envFile',
        filepath: '.env',
        errors: [exampleError]
      },
      {
        type: 'env',
        string: src,
        privateKeyName: null,
        privateKey: null,
        parsed: { options: ' optA optB optC optX optD', configX: 'blah' },
        errors: [],
        injected: { options: ' optA optB optC optX optD', configX: 'blah' },
        preExisted: {}
      }
    ])
    ct.same(readableFilepaths, [])
    ct.same(uniqueInjectedKeys, ['options', 'configX'])

    process.chdir(cwd)
    ct.end()
  })
