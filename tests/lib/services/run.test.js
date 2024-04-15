const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Run = require('../../../src/lib/services/run')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    error: exampleError
  }])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').throws(new Error('Mock Error'))

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    error: exampleError
  }])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, [])

  readFileSyncStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (finds .env file) with already falsy value', ct => {
  process.env.HELLO = '' // falsy value

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {},
    preExisted: {
      HELLO: ''
    }
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (finds .env file but HELLO already exists)', ct => {
  process.env.HELLO = 'World'

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {},
    preExisted: {
      HELLO: 'World'
    }
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (finds .env file but HELLO already exists but overload is on)', ct => {
  process.env.HELLO = 'World'

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, true).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (command substitution)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.eval' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/.env.eval',
    parsed: {
      HELLO: 'world'
    },
    injected: {
      HELLO: 'world'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/.env.eval'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (with envs as string)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]

  // it should still prepend a type 'envFile': value: '.env'
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'
  ct.same(processedEnvs, [
    {
      type: 'envFile',
      filepath: '.env',
      error: exampleError
    },
    {
      type: 'env',
      string: 'HELLO=string',
      parsed: {
        HELLO: 'string'
      },
      injected: {
        HELLO: 'string'
      },
      preExisted: {}
    }
  ])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (with envs as string and errors somehow from inject)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'
  const run = new Run(envs)
  const mockError = new Error('Mock Error')
  const injectStub = sinon.stub(run, '_inject').throws(mockError)

  const {
    processedEnvs
  } = run.run()

  ct.same(processedEnvs, [
    {
      type: 'envFile',
      filepath: '.env',
      error: exampleError
    },
    {
      type: 'env',
      string: 'HELLO=string',
      error: mockError,
      parsed: {
        HELLO: 'string'
      }
    }
  ])

  injectStub.restore()

  ct.end()
})

t.test('#run (mixed string and file)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' },
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [
    {
      type: 'env',
      string: 'HELLO=string',
      parsed: { HELLO: 'string' },
      injected: { HELLO: 'string' },
      preExisted: {}
    },
    {
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      parsed: { HELLO: 'frontend' },
      injected: {},
      preExisted: { HELLO: 'string' }
    }
  ])

  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run DOTENV_KEY passed but .env.vault not found', ct => {
  try {
    new Run([], false, '<dotenvkeyhere>').run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error(`you set DOTENV_KEY but your .env.vault file is missing: ${path.resolve('.env.vault')}`)
    exampleError.code = 'MISSING_ENV_VAULT_FILE'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#run --env-vault-file but missing DOTENV_KEY', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]

  try {
    new Run(envs, false, undefined).run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('your DOTENV_KEY appears to be blank: \'\'')
    exampleError.code = 'MISSING_DOTENV_KEY'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#run (incorrect/failed-decryption DOTENV_KEY argument)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development'

  try {
    new Run(envs, false, DOTENV_KEY).run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
    exampleError.help = '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.'
    exampleError.code = 'DECRYPTION_FAILED'
    exampleError.debug = '[DECRYPTION_FAILED] DOTENV_KEY is dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#run (partly failed-decryption DOTENV_KEY argument second key succeeds. comma separated)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, false, DOTENV_KEY).run()

  ct.same(processedEnvs, [
    {
      type: 'envVaultFile',
      filepath: 'tests/monorepo/apps/backend/.env.vault',
      parsed: { HELLO: 'backend' },
      injected: { HELLO: 'backend' },
      preExisted: {}
    }
  ])

  ct.same(readableFilepaths, ['tests/monorepo/apps/backend/.env.vault'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (.env.vault and DOTENV_KEY)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, false, DOTENV_KEY).run()

  ct.same(processedEnvs, [
    {
      type: 'envVaultFile',
      filepath: 'tests/monorepo/apps/backend/.env.vault',
      parsed: { HELLO: 'backend' },
      injected: { HELLO: 'backend' },
      preExisted: {}
    }
  ])
  ct.same(readableFilepaths, ['tests/monorepo/apps/backend/.env.vault'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (.env.vault and DOTENV_KEY with errors somehow from inject)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const run = new Run(envs, false, DOTENV_KEY)
  const mockError = new Error('Mock Error')
  const injectStub = sinon.stub(run, '_inject').throws(mockError)

  const {
    processedEnvs
  } = run.run()

  ct.same(processedEnvs, [
    {
      type: 'envVaultFile',
      filepath: 'tests/monorepo/apps/backend/.env.vault',
      error: mockError,
      parsed: {
        HELLO: 'backend'
      }
    }
  ])

  injectStub.restore()

  ct.end()
})

t.test('#run (.env.vault and DOTENV_KEY and machine env already set)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  process.env.HELLO = 'machine'

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, false, DOTENV_KEY).run()

  ct.same(processedEnvs, [
    {
      type: 'envVaultFile',
      filepath: 'tests/monorepo/apps/backend/.env.vault',
      parsed: { HELLO: 'backend' },
      injected: {},
      preExisted: { HELLO: 'machine' }
    }
  ])
  ct.same(readableFilepaths, ['tests/monorepo/apps/backend/.env.vault'])
  ct.same(uniqueInjectedKeys, [])
  ct.same(process.env.HELLO, 'machine')

  ct.end()
})

t.test('#run (.env.vault and DOTENV_KEY and machine env already set but overload is true)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  process.env.HELLO = 'machine'

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, true, DOTENV_KEY).run()

  ct.same(processedEnvs, [
    {
      type: 'envVaultFile',
      filepath: 'tests/monorepo/apps/backend/.env.vault',
      parsed: { HELLO: 'backend' },
      injected: { HELLO: 'backend' },
      preExisted: {}
    }
  ])
  ct.same(readableFilepaths, ['tests/monorepo/apps/backend/.env.vault'])
  ct.same(uniqueInjectedKeys, ['HELLO'])
  ct.same(process.env.HELLO, 'backend')

  ct.end()
})

t.test('#_dotenvKeys', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const run = new Run(envs, false, DOTENV_KEY)
  const results = run._dotenvKeys()

  ct.same(results, [DOTENV_KEY])

  ct.end()
})

t.test('#_dotenvKeys (separated by comma)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  const run = new Run(envs, false, DOTENV_KEY)

  const results = run._dotenvKeys()

  ct.same(results, [
    'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development',
    'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  ])

  ct.end()
})

t.test('#_dotenvKeys (undefined)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const run = new Run(envs, false)

  const results = run._dotenvKeys()

  ct.same(results, [''])

  ct.end()
})

t.test('#_decrypted', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  const envVaultFile = 'tests/monorepo/apps/backend/.env.vault'
  const filepath = path.resolve(envVaultFile)

  const run = new Run(envs, false, DOTENV_KEY)
  const parsedVault = run._parsedVault(filepath)

  const decrypted = run._decrypted(DOTENV_KEY, parsedVault)

  const expected = `# for testing purposes only
HELLO="backend"
`
  ct.same(decrypted, expected)

  ct.end()
})

t.test('#_decrypted (can\'t find environment)', ct => {
  const envs = [
    { type: 'envVaultFile', value: 'tests/monorepo/apps/backend/.env.vault' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=other'
  const envVaultFile = 'tests/monorepo/apps/backend/.env.vault'
  const filepath = path.resolve(envVaultFile)

  const run = new Run(envs, false, DOTENV_KEY)
  const parsedVault = run._parsedVault(filepath)

  try {
    run._decrypted(DOTENV_KEY, parsedVault)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment DOTENV_VAULT_OTHER in your .env.vault file')
    exampleError.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#_determineEnvs when envs is empty array but DOTENV_KEY is set', ct => {
  const envs = []
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const run = new Run(envs, false, DOTENV_KEY)
  const determinedEnvs = run._determineEnvs(envs, DOTENV_KEY)

  ct.same(determinedEnvs, [{ type: 'envVaultFile', value: '.env.vault' }])

  ct.end()
})

t.test('#_determineEnvs when envs is only --env flags but DOTENV_KEY is set', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const run = new Run(envs, false, DOTENV_KEY)
  const determinedEnvs = run._determineEnvs(envs, DOTENV_KEY)

  ct.same(determinedEnvs, [{ type: 'envVaultFile', value: '.env.vault' }, { type: 'env', value: 'HELLO=string' }])

  ct.end()
})
