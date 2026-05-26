const t = require('tap')
const fs = require('fs')
const fsx = require('../../../src/lib/helpers/fsx')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const dotenvParse = require('../../../src/lib/helpers/dotenvParse')
const decryptKeyValue = require('../../../src/lib/helpers/cryptography/decryptKeyValue')

const Encrypt = require('../../../src/lib/services/encrypt')

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

function helloValues (envSrc) {
  return dotenvParse(envSrc, false, false, true).HELLO || []
}

function decryptHelloValues (envSrc, privateKeyName, privateKey) {
  return helloValues(envSrc).map(value => decryptKeyValue('HELLO', value, privateKeyName, privateKey))
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  cleanupRootEnvFiles()
  writeFileXStub = sinon.stub(fsx, 'writeFileX')
})

t.afterEach((ct) => {
  writeFileXStub.restore()
  cleanupRootEnvFiles()
})

t.test('#run (no arguments)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)

    // allow real writes in this isolated temp dir
    writeFileXStub.callsFake(async (filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([], [], [], null, true).run()

    ct.equal(processedEnvs.length, 1)
    ct.equal(processedEnvs[0].envFilepath, '.env')
    ct.notOk(processedEnvs[0].error)
    ct.same(changedFilepaths, ['.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(processedEnvs[0].envSrc)
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'provisions public key on first encrypt')
    ct.match(parsed.OPENAI_API_KEY, /^encrypted:/, 'encrypts sample kit values on first encrypt')
    ct.ok(fs.existsSync(path.join(tmpdir, '.env.keys')), 'creates .env.keys on first encrypt (ops off)')

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no env file) with --no-create',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([], [], [], null, true, true).run()

    ct.equal(processedEnvs.length, 1)
    ct.equal(processedEnvs[0].envFilepath, '.env')
    ct.equal(processedEnvs[0].error.code, 'MISSING_ENV_FILE')
    ct.notOk(writeFileXStub.called, 'does not create missing .env file')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no env file) does not write plaintext sample if provisioning aborts',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)

    const provisionError = new Error('prompt aborted')
    const cryptography = require('../../../src/lib/helpers/cryptography')
    const EncryptWithProvisionStub = proxyquire('../../../src/lib/services/encrypt', {
      './../helpers/cryptography': {
        ...cryptography,
        provision: sinon.stub().rejects(provisionError)
      }
    })

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new EncryptWithProvisionStub([], [], [], null, false).run()

    ct.equal(processedEnvs.length, 1)
    ct.equal(processedEnvs[0].error, provisionError)
    ct.notOk(fs.existsSync(path.join(tmpdir, '.env')), 'does not leave plaintext .env behind')
    ct.notOk(writeFileXStub.calledWith(path.join(tmpdir, '.env'), sinon.match.string), 'does not write .env before provisioning completes')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run forwards key storage selector to provision',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const cryptography = require('../../../src/lib/helpers/cryptography')
    const kp = cryptography.localKeypair()
    const provision = sinon.stub().resolves({
      envSrc: `DOTENV_PUBLIC_KEY="${kp.publicKey}"\nHELLO=world\n`,
      publicKey: kp.publicKey,
      privateKey: kp.privateKey
    })
    const selectKeyStorage = sinon.stub().resolves('armored')
    const EncryptWithProvisionStub = proxyquire('../../../src/lib/services/encrypt', {
      './../helpers/cryptography': {
        ...cryptography,
        provision
      }
    })

    const {
      processedEnvs,
      changedFilepaths
    } = await new EncryptWithProvisionStub([], [], [], null, false, false, undefined, { selectKeyStorage }).run()

    ct.equal(processedEnvs.length, 1)
    ct.notOk(processedEnvs[0].error)
    ct.same(changedFilepaths, ['.env'])
    ct.equal(provision.callCount, 1)
    ct.equal(provision.firstCall.args[0].selectKeyStorage, selectKeyStorage)
    ct.equal(provision.firstCall.args[0].envFilepath, '.env')

    process.chdir(cwd)
    ct.end()
  })

t.test('#run does not prompt for key storage when existing public key is resolved',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const cryptography = require('../../../src/lib/helpers/cryptography')
    const kp = cryptography.localKeypair()
    const keyNames = require('../../../src/lib/helpers/keyResolution/keyNames')
    const keyValues = sinon.stub().resolves({
      publicKeyValue: kp.publicKey,
      privateKeyValue: null
    })
    const provision = sinon.stub().rejects(new Error('should not provision'))
    const selectKeyStorage = sinon.stub().resolves('local')
    const EncryptWithStubs = proxyquire('../../../src/lib/services/encrypt', {
      './../helpers/keyResolution': {
        keyNames,
        keyValues
      },
      './../helpers/cryptography': {
        ...cryptography,
        provision
      }
    })

    const {
      processedEnvs,
      changedFilepaths
    } = await new EncryptWithStubs([], [], [], null, false, false, undefined, { selectKeyStorage }).run()

    ct.equal(processedEnvs.length, 1)
    ct.notOk(processedEnvs[0].error)
    ct.same(changedFilepaths, ['.env'])
    ct.equal(keyValues.callCount, 1)
    ct.same(keyValues.firstCall.args[1], {
      keysFilepath: null,
      noVlt: false,
      keypairHooks: undefined
    })
    ct.equal(selectKeyStorage.callCount, 0)
    ct.equal(provision.callCount, 0)

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (blank existing .env file) seeds sample kit before encrypting',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)

    const envPath = path.join(tmpdir, '.env')
    fs.writeFileSync(envPath, '', 'utf8')

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([], [], [], null, true).run()

    ct.equal(processedEnvs.length, 1)
    ct.equal(processedEnvs[0].envFilepath, '.env')
    ct.equal(processedEnvs[0].kitCreated, 'sample')
    ct.notOk(processedEnvs[0].error)
    ct.same(changedFilepaths, ['.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(processedEnvs[0].envSrc)
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'provisions public key on encrypt')
    ct.match(parsed.OPENAI_API_KEY, /^encrypted:/, 'encrypts seeded sample value')

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (no arguments and some other error)',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')
    const readFileXStub = sinon.stub(fsx, 'readFileX').rejects(new Error('Mock Error'))

    const inst = new Encrypt()

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
    const envFile = 'tests/monorepo/apps/frontend/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run (finds .env file) with ops off and no existing keys still generates .env.keys',
  async ct => {
    const envFile = 'tests/monorepo/apps/frontend/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

    ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])
    ct.equal(processedEnvs[0].localPrivateKeyAdded, true)

    ct.end()
  })

t.test('#run (finds .env file with multiline values - implicit and explicit newline)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiline/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run (finds .env file with CRLF multiline values - implicit and explicit CRLF newline)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiline/.env.crlf'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run (finds .env file already encrypted)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])

    ct.end()
  })

t.test('#run encrypts every duplicate HELLO when both entries start plaintext',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-duplicate-'))
    process.chdir(tmpdir)

    fs.writeFileSync('.env', 'HELLO=one\nHELLO=two\n', 'utf8')
    writeFileXStub.callsFake(async (filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([{ type: 'envFile', value: '.env' }], [], [], null, true).run()

    const row = processedEnvs[0]
    const values = helloValues(row.envSrc)

    ct.same(changedFilepaths, ['.env'])
    ct.same(unchangedFilepaths, [])
    ct.equal(values.length, 2, 'preserves both duplicate HELLO entries')
    ct.ok(values.every(value => value.startsWith('encrypted:')), 'encrypts every duplicate HELLO entry')
    ct.same(decryptHelloValues(row.envSrc, row.privateKeyName, row.privateKey), ['one', 'two'])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run encrypts appended plaintext duplicate HELLO when an earlier entry is already encrypted',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-duplicate-'))
    process.chdir(tmpdir)

    fs.writeFileSync('.env', 'HELLO=one\n', 'utf8')
    writeFileXStub.callsFake(async (filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const firstRun = await new Encrypt([{ type: 'envFile', value: '.env' }], [], [], null, true).run()
    fs.writeFileSync('.env', `${firstRun.processedEnvs[0].envSrc}HELLO=two\n`, 'utf8')

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([{ type: 'envFile', value: '.env' }], [], [], null, true).run()

    const row = processedEnvs[0]
    const values = helloValues(row.envSrc)

    ct.same(changedFilepaths, ['.env'])
    ct.same(unchangedFilepaths, [])
    ct.equal(values.length, 2, 'preserves both duplicate HELLO entries')
    ct.ok(values.every(value => value.startsWith('encrypted:')), 'encrypts every duplicate HELLO entry')
    ct.same(decryptHelloValues(row.envSrc, row.privateKeyName, row.privateKey), ['one', 'two'])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run encrypts prepended plaintext duplicate HELLO when a later entry is already encrypted',
  async ct => {
    const cwd = process.cwd()
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-encrypt-duplicate-'))
    process.chdir(tmpdir)

    fs.writeFileSync('.env', 'HELLO=one\n', 'utf8')
    writeFileXStub.callsFake(async (filepath, str) => fs.writeFileSync(filepath, str, 'utf8'))

    const firstRun = await new Encrypt([{ type: 'envFile', value: '.env' }], [], [], null, true).run()
    fs.writeFileSync('.env', `HELLO=two\n${firstRun.processedEnvs[0].envSrc}`, 'utf8')

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt([{ type: 'envFile', value: '.env' }], [], [], null, true).run()

    const row = processedEnvs[0]
    const values = helloValues(row.envSrc)

    ct.same(changedFilepaths, ['.env'])
    ct.same(unchangedFilepaths, [])
    ct.equal(values.length, 2, 'preserves both duplicate HELLO entries')
    ct.ok(values.every(value => value.startsWith('encrypted:')), 'encrypts every duplicate HELLO entry')
    ct.same(decryptHelloValues(row.envSrc, row.privateKeyName, row.privateKey), ['two', 'one'])

    process.chdir(cwd)
    ct.end()
  })

t.test('#run (finds .env file with specified key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, ['HELLO2'], [], null, true).run()

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

t.test('#run (finds .env file with specified key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, 'HELLO2', [], null, true).run()

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

t.test('#run (finds .env file with specified glob string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, 'H*', [], null, true).run()

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

t.test('#run (finds .env file excluding specified key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], ['HELLO2'], null, true).run()

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

t.test('#run (finds .env file excluding specified key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], 'HELLO3', null, true).run()

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

t.test('#run (finds .env file excluding specified key globbed)',
  async ct => {
    const envFile = 'tests/monorepo/apps/multiple/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], 'HE*', null, true).run()

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

t.test('#run (finds .env.export file with exported key)',
  async ct => {
    const envFile = 'tests/.env.export'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run (finds .env and .env.keys file) but derived public key does not match configured public key',
  async ct => {
    process.env.DOTENV_PUBLIC_KEY = '12345'

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs
    } = await new Encrypt(envs, [], [], null, true).run()

    const error = new Error('[MISPAIRED_PRIVATE_KEY] private key\'s derived public key (03eaf21…) does not match the existing public key (12345…)')
    error.code = 'MISPAIRED_PRIVATE_KEY'
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/752]'
    error.messageWithHelp = '[MISPAIRED_PRIVATE_KEY] private key\'s derived public key (03eaf21…) does not match the existing public key (12345…). fix: [https://github.com/dotenvx/dotenvx/issues/752]'

    ct.same(processedEnvs, [{
      keys: [],
      type: 'envFile',
      filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
      envFilepath: 'tests/monorepo/apps/encrypted/.env',
      error
    }])

    ct.end()
  })

t.test('#run (finds .env file only)',
  async ct => {
    const Keypair = require('../../../src/lib/services/keypair')
    const sandbox = sinon.createSandbox()
    sandbox.stub(Keypair.prototype, 'runSync').callsFake(function () {
      return { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba' }
    })

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run (finds .env file) and custom envKeysFilepath',
  async ct => {
    const envKeysFilepath = 'tests/monorepo/.env.keys'
    const envFile = 'tests/monorepo/apps/app1/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Encrypt(envs, [], [], envKeysFilepath, true).run()

    const row = processedEnvs[0]
    const publicKey = row.publicKey
    const privateKey = row.privateKey
    const localPrivateKeyAdded = row.localPrivateKeyAdded
    const remotePrivateKeyAdded = row.remotePrivateKeyAdded
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
      localPrivateKeyAdded,
      remotePrivateKeyAdded,
      privateKeyName,
      envSrc
    }])
    ct.same(changedFilepaths, ['tests/monorepo/apps/app1/.env'])

    ct.end()
  })

t.test('#run (finds .env file) and custom envKeysFilepath and privateKey already exists',
  async ct => {
    const envKeysFilepath = 'tests/monorepo/.env.keys'
    const envFile = 'tests/monorepo/apps/app1/.env.production'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths
    } = await new Encrypt(envs, [], [], envKeysFilepath, true).run()

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

t.test('#run (finds .env file only AND only the existing public key not the private key)',
  async ct => {
    const sandbox = sinon.createSandbox()

    const keyValuesStub = sandbox.stub().returns({
      publicKeyValue: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      privateKeyValue: null
    })
    const keyNames = require('../../../src/lib/helpers/keyResolution/keyNames')

    // Load Encrypt with the stub injected
    const Encrypt = proxyquire('../../../src/lib/services/encrypt', {
      './../helpers/keyResolution': {
        keyNames,
        keyValues: keyValuesStub
      }
    })

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      unchangedFilepaths
    } = await new Encrypt(envs, [], [], null, true).run()

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

t.test('#run wraps invalid public key encryption errors',
  async ct => {
    const sandbox = sinon.createSandbox()
    const cryptography = require('../../../src/lib/helpers/cryptography')
    const EncryptWithStub = proxyquire('../../../src/lib/services/encrypt', {
      './../helpers/cryptography': {
        ...cryptography,
        encryptValue: () => {
          throw new Error('padded hex string expected, got unpadded hex of length 67')
        }
      }
    })

    const envFile = 'tests/monorepo/apps/frontend/.env'
    const envs = [{ type: 'envFile', value: envFile }]

    const { processedEnvs, changedFilepaths } = await new EncryptWithStub(envs).run()

    ct.equal(processedEnvs[0].error.code, 'INVALID_PUBLIC_KEY')
    ct.match(processedEnvs[0].error.message, /^\[INVALID_PUBLIC_KEY\] could not encrypt using public key 'DOTENV_PUBLIC_KEY=/)
    ct.equal(processedEnvs[0].error.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/756]')
    ct.same(changedFilepaths, [])

    sandbox.restore()
    ct.end()
  })
