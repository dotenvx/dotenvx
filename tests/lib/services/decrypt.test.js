const t = require('tap')
const fs = require('fs')
const fsx = require('../../../src/lib/helpers/fsx')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const dotenv = require('dotenv')

const Decrypt = require('../../../src/lib/services/decrypt')

let writeFileXStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  writeFileXStub = sinon.stub(fsx, 'writeFileXSync')
})

t.afterEach((ct) => {
  writeFileXStub.restore()
})

t.test('#run (no arguments)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-decrypt-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt().run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

    ct.same(processedEnvs, [{
      keys: [],
      type: 'envFile',
      filepath: path.resolve('.env'),
      envFilepath: '.env',
      error: exampleError
    }])
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no env file)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-decrypt-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt().run()

    const exampleError = new Error('[MISSING_ENV_FILE] missing file (.env)')
    exampleError.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
    exampleError.code = 'MISSING_ENV_FILE'
    exampleError.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

    ct.same(processedEnvs, [{
      keys: [],
      type: 'envFile',
      filepath: path.resolve('.env'),
      envFilepath: '.env',
      error: exampleError
    }])
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no arguments and some other error)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-decrypt-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const readFileXStub = sinon.stub(fsx, 'readFileX').rejects(new Error('Mock Error'))

    const inst = new Decrypt()

    const {
      processedEnvs,
      changedFilepaths
    } = await inst.run()

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
    process.chdir(cwd)
    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.same(parsed.HELLO, 'encrypted') // the decrypted value is 'encrypted'

    ct.end()
  })

t.test('#run (finds .env file with multiline value)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiline/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiline/.env')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, ['tests/monorepo/apps/multiline/.env'])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['HELLO', 'ALOHA'])
    ct.same(parsed.HELLO, `-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
IJKL
-----END RSA PRIVATE KEY-----`)

    const output = `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
IJKL
-----END RSA PRIVATE KEY-----"
ALOHA="-----BEGIN RSA PRIVATE KEY-----\\nABCD\\nEFGH\\nIJKL\\n-----END RSA PRIVATE KEY-----"
`
    ct.same(p1.envSrc, output)

    ct.end()
  })

t.test('#run (finds .env file with specified key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, ['HELLO2']).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO2'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should still be encrypted')
    ct.match(parsed.HELLO2, 'two', 'HELLO2 should be decrypted')
    ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should still be encrypted')

    ct.end()
  })

t.test('#run (finds .env file with specified key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, 'HELLO2').run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO2'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should still be encrypted')
    ct.match(parsed.HELLO2, 'two', 'HELLO2 should be decrypted')
    ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should still be encrypted')

    ct.end()
  })

t.test('#run (finds .env file with specified key as glob pattern)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, 'HE*').run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO', 'HELLO2', 'HELLO3'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, 'one', 'HELLO should be decrypted')
    ct.match(parsed.HELLO2, 'two', 'HELLO2 should be decrypted')
    ct.match(parsed.HELLO3, 'three', 'HELLO3 should be decrypted')

    ct.end()
  })

t.test('#run (finds .env file with excluded key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, [], ['HELLO2']).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO', 'HELLO3'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, 'one', 'HELLO should be decrypted')
    ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should still be encrypted')
    ct.match(parsed.HELLO3, 'three', 'HELLO3 should be decrypted')

    ct.end()
  })

t.test('#run (finds .env file with excluded key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, [], 'HELLO2').run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO', 'HELLO3'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, 'one', 'HELLO should be decrypted')
    ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO should still be encrypted')
    ct.match(parsed.HELLO3, 'three', 'HELLO3 should be decrypted')

    ct.end()
  })

t.test('#run (finds .env file with excluded key glob string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]
    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Decrypt(envs, [], 'HEL*').run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/multiple/.env.production')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, ['tests/monorepo/apps/multiple/.env.production'])

    const parsed = dotenv.parse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_PRODUCTION', 'HELLO', 'HELLO2', 'HELLO3'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, 'DOTENV_PUBLIC_KEY_PRODUCTION should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should still be encrypted')
    ct.match(parsed.HELLO2, /^encrypted:/, 'HELLO2 should still be encrypted')
    ct.match(parsed.HELLO3, /^encrypted:/, 'HELLO3 should still be encrypted')

    ct.end()
  })
