const t = require('tap')
const fs = require('fs')
const fsx = require('../../../src/lib/helpers/fsx')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const dotenvParse = require('../../../src/lib/helpers/dotenvParse')

const Rotate = require('../../../src/lib/services/rotate')

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
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-rotate-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate().run()

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
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-rotate-'))
    process.chdir(tmpdir)

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate().run()

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
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-rotate-'))
    process.chdir(tmpdir)
    fs.writeFileSync('.env', 'HELLO=world\n', 'utf8')

    const readFileXStub = sinon.stub(fsx, 'readFileX').rejects(new Error('Mock Error'))

    const inst = new Rotate()

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

t.test('#run (missing .env.keys) returns missing env keys file error',
  async ct => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-rotate-'))
    const envFile = path.join(tmpdir, '.env')
    fs.writeFileSync(envFile, [
      'DOTENV_PUBLIC_KEY="03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba"',
      'HELLO="encrypted:abc"'
    ].join('\n') + '\n', 'utf8')

    const envs = [{ type: 'envFile', value: envFile }]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], [], null, true).run()

    ct.equal(processedEnvs[0].error.code, 'MISSING_ENV_KEYS_FILE')
    ct.match(processedEnvs[0].error.message, /\[MISSING_ENV_KEYS_FILE\] missing file \(.+\.env\.keys\)/)
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])
    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], [], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.not(parsed.HELLO, originalParsed.HELLO, 'HELLO should differ after rotation')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file with specified key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, ['HELLO'], [], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.not(parsed.HELLO, originalParsed.HELLO, 'HELLO should differ after rotation')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file with specified key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, 'HELLO', [], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.not(parsed.HELLO, originalParsed.HELLO, 'HELLO should differ after rotation')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file with specified glob string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, 'H*', [], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.not(parsed.HELLO, originalParsed.HELLO, 'HELLO should differ after rotation')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file excluding specified key)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], ['HELLO'], null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.same(parsed.HELLO, originalParsed.HELLO, 'HELLO should be same after rotation because it was excluded')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file excluding specified key as string)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], 'HELLO', null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.same(parsed.HELLO, originalParsed.HELLO, 'HELLO should be same after rotation because it was excluded')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file excluding specified key globbed)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], 'HE*', null, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, [])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.same(parsed.HELLO, originalParsed.HELLO, 'HELLO should be same after rotation because it was excluded')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

// t.test('#run (finds .env.export file with exported key)',
// async ct => {
//   const envFile = 'tests/.env.export'
//   const envs = [
//     { type: 'envFile', value: envFile }
//   ]
//
//   const {
//     processedEnvs,
//     changedFilepaths,
//     unchangedFilepaths
//   } = await new Rotate(envs).run()
//
//   const p1 = processedEnvs[0]
//   ct.same(p1.keys, ['KEY'])
//   ct.same(p1.envFilepath, 'tests/.env.export')
//   ct.same(changedFilepaths, ['tests/.env.export'])
//   ct.same(unchangedFilepaths, [])
//
//   const parsed = dotenvParse(p1.envSrc)
//
//   ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY_EXPORT', 'KEY'])
//   ct.ok(parsed.DOTENV_PUBLIC_KEY_EXPORT, 'DOTENV_PUBLIC_KEY should not be empty')
//   ct.match(parsed.KEY, /^encrypted:/, 'KEY should start with "encrypted:"')
//
//   const output = `#!/usr/bin/env bash
// #/-------------------[DOTENV_PUBLIC_KEY]--------------------/
// #/            public-key encryption for .env files          /
// #/       [how it works](https://dotenvx.com/encryption)     /
// #/----------------------------------------------------------/
// DOTENV_PUBLIC_KEY_EXPORT="${parsed.DOTENV_PUBLIC_KEY_EXPORT}"
//
// # .env.export
// export KEY=${parsed.KEY}
// `
//   ct.same(p1.envSrc, output)
//
//   ct.end()
// })
//
// t.test('#run (finds .env and .env.keys file) but derived public key does not match configured public key',
// async ct => {
//   process.env.DOTENV_PUBLIC_KEY = '12345'
//
//   const envFile = 'tests/monorepo/apps/encrypted/.env'
//   const envs = [
//     { type: 'envFile', value: envFile }
//   ]
//
//   const {
//     processedEnvs
//   } = await new Rotate(envs).run()
//
//   const error = new Error('derived public key (03eaf21…) does not match the existing public key (12345…)')
//   error.code = 'INVALID_DOTENV_PRIVATE_KEY'
//   error.help = 'debug info: DOTENV_PRIVATE_KEY=ec9e800… (derived DOTENV_PUBLIC_KEY=03eaf21… vs existing DOTENV_PUBLIC_KEY=12345…)'
//
//   ct.same(processedEnvs, [{
//     keys: [],
//     type: 'envFile',
//     filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
//     envFilepath: 'tests/monorepo/apps/encrypted/.env',
//     error
//   }])
//
//   ct.end()
// })
//
// t.test('#run (finds .env file only)',
// async ct => {
//   const Keypair = require('../../../src/lib/services/keypair')
//   const sandbox = sinon.createSandbox()
//   sandbox.stub(Keypair.prototype, 'runSync').callsFake(function () {
//     return { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba' }
//   })
//
//   const envFile = 'tests/monorepo/apps/encrypted/.env'
//   const envs = [
//     { type: 'envFile', value: envFile }
//   ]
//
//   const {
//     processedEnvs,
//     unchangedFilepaths
//   } = await new Rotate(envs).run()
//
//   const row = processedEnvs[0]
//   const publicKey = row.publicKey
//   const privateKey = row.privateKey
//   const privateKeyName = row.privateKeyName
//   const envSrc = row.envSrc
//
//   ct.same(processedEnvs, [{
//     keys: [],
//     type: 'envFile',
//     filepath: path.resolve('tests/monorepo/apps/encrypted/.env'),
//     envFilepath: 'tests/monorepo/apps/encrypted/.env',
//     publicKey,
//     privateKey,
//     privateKeyName,
//     envSrc
//   }])
//   ct.same(unchangedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
//
//   sandbox.restore()
//
//   ct.end()
// })
//
t.test('#run (finds .env file) and custom envKeysFilepath',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

    const originalParsed = dotenvParse(fsx.readFileXSync(envFile))
    const originalKeysParsed = dotenvParse(fsx.readFileXSync(envKeysFile))

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Rotate(envs, [], [], envKeysFile, true).run()

    const p1 = processedEnvs[0]
    ct.same(p1.keys, ['HELLO'])
    ct.same(p1.envFilepath, 'tests/monorepo/apps/encrypted/.env')
    ct.same(changedFilepaths, ['tests/monorepo/apps/encrypted/.env'])
    ct.same(unchangedFilepaths, [])

    const parsed = dotenvParse(p1.envSrc)

    ct.same(Object.keys(parsed), ['DOTENV_PUBLIC_KEY', 'HELLO'])
    ct.ok(parsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should not be empty')
    ct.match(parsed.HELLO, /^encrypted:/, 'HELLO should start with "encrypted:"')

    const parsedKeys = dotenvParse(p1.envKeysSrc)
    ct.same(Object.keys(parsedKeys), ['DOTENV_PRIVATE_KEY'])

    ct.not(parsed.HELLO, originalParsed.HELLO, 'HELLO should differ after rotation')
    ct.not(parsed.DOTENV_PUBLIC_KEY, originalParsed.DOTENV_PUBLIC_KEY, 'DOTENV_PUBLIC_KEY should differ after rotation')
    ct.not(parsedKeys.DOTENV_PRIVATE_KEY, originalKeysParsed.DOTENV_PRIVATE_KEY, 'DOTENV_PRIVATE_KEY should differ after rotation')

    ct.end()
  })

t.test('#run (finds .env file) with opsOn uses ops keypair and does not append local keys file',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const cryptography = require('../../../src/lib/helpers/cryptography')
    const opsKeypair = sinon.stub().returns({
      publicKey: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      privateKey: 'new-private-key-from-ops'
    })

    const RotateWithOpsStub = proxyquire('../../../src/lib/services/rotate', {
      './../helpers/cryptography': { ...cryptography, opsKeypair }
    })

    const envs = [
      { type: 'envFile', value: envFile }
    ]

    const { processedEnvs } = await new RotateWithOpsStub(envs, [], [], null, false).run()

    const p1 = processedEnvs[0]
    ct.equal(opsKeypair.callCount, 1)
    ct.equal(p1.localPrivateKeyAdded, false)
    ct.notOk(p1.envKeysSrc)
    ct.notOk(p1.envKeysFilepath)
    ct.equal(p1.privateKey, 'new-private-key-from-ops')
    ct.match(p1.envSrc, /DOTENV_PUBLIC_KEY=/)
    ct.end()
  })

t.test('#run wraps invalid public key re-encryption errors',
  async ct => {
    const cryptography = require('../../../src/lib/helpers/cryptography')
    const RotateWithStub = proxyquire('../../../src/lib/services/rotate', {
      './../helpers/cryptography': {
        ...cryptography,
        encryptValue: () => {
          throw new Error('padded hex string expected, got unpadded hex of length 67')
        }
      }
    })

    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const envs = [{ type: 'envFile', value: envFile }]

    const { processedEnvs, changedFilepaths } = await new RotateWithStub(envs, [], [], null, true).run()

    ct.equal(processedEnvs[0].error.code, 'INVALID_PUBLIC_KEY')
    ct.match(processedEnvs[0].error.message, /^\[INVALID_PUBLIC_KEY\] could not encrypt using public key 'DOTENV_PUBLIC_KEY=/)
    ct.equal(processedEnvs[0].error.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/756]')
    ct.same(changedFilepaths, [])

    ct.end()
  })

t.test('#run handles ENOENT without error.path as missing env file',
  async ct => {
    const RotateWithStub = proxyquire('../../../src/lib/services/rotate', {
      './../helpers/detectEncoding': async () => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }) }
    })

    const envs = [{ type: 'envFile', value: '.env' }]
    const { processedEnvs, changedFilepaths, unchangedFilepaths } = await new RotateWithStub(envs, [], [], null, true).run()

    ct.equal(processedEnvs[0].error.code, 'MISSING_ENV_FILE')
    ct.same(changedFilepaths, [])
    ct.same(unchangedFilepaths, [])
    ct.end()
  })

// t.test('#run (finds .env file) and custom envKeysFilepath and privateKey already exists',
// async ct => {
//   const envKeysFilepath = 'tests/monorepo/.env.keys'
//   const envFile = 'tests/monorepo/apps/app1/.env.production'
//   const envs = [
//     { type: 'envFile', value: envFile }
//   ]
//
//   const {
//     processedEnvs,
//     changedFilepaths
//   } = await new Rotate(envs, [], [], envKeysFilepath).run()
//
//   const row = processedEnvs[0]
//   const publicKey = row.publicKey
//   const privateKey = row.privateKey
//   const privateKeyName = row.privateKeyName
//   const envSrc = row.envSrc
//
//   ct.same(processedEnvs, [{
//     keys: ['HELLO'],
//     type: 'envFile',
//     filepath: path.resolve('tests/monorepo/apps/app1/.env.production'),
//     envFilepath: 'tests/monorepo/apps/app1/.env.production',
//     changed: true,
//     publicKey,
//     privateKey,
//     privateKeyName,
//     envSrc
//   }])
//   ct.same(changedFilepaths, ['tests/monorepo/apps/app1/.env.production'])
//
//   ct.end()
// })
