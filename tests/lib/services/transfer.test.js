const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const path = require('node:path')

t.beforeEach(() => {
  sinon.restore()
})

const defaultKeynames = () => ({
  publicKeyName: 'DOTENV_PUBLIC_KEY',
  privateKeyName: 'DOTENV_PRIVATE_KEY'
})

t.test('transfer throws when readEnvKey fails to find public key', async ct => {
  const readEnvKeyStub = sinon.stub().throws(new Error('[MISSING_PUBLIC_KEY] missing public key'))
  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': readEnvKeyStub
  })

  await ct.rejects(
    transfer('.env'),
    /missing public key/
  )
})

t.test('transfer prompts for source when multiple local sources exist', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const source1 = { id: 'file', name: '.env.keys', privateKey, remove: sinon.stub().resolves() }
  const source2 = { id: 'native', name: 'Keychain', privateKey, remove: sinon.stub().resolves() }

  const selectPromptStub = sinon.stub().resolves('1') // select source2 (index 1)
  const selectKeyStorageStub = sinon.stub().resolves('native') // destination same as source2 -> changed: false

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source1, source2]),
    '../helpers/prompts': { select: selectPromptStub },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/selectKeyStorage': selectKeyStorageStub,
    '../custodians': {
      get: sinon.stub().withArgs('native').returns({ id: 'native', name: 'Keychain' })
    }
  })

  const result = await transfer('.env')

  ct.equal(selectPromptStub.firstCall.args[0].message, 'Private key found in multiple stores. Transfer from')
  ct.same(result, {
    changed: false,
    publicKey,
    from: 'Keychain',
    to: 'Keychain',
    toId: 'native'
  })
})

t.test('transfer throws when multiple local sources exist and selected source is invalid', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const source1 = { id: 'file', name: '.env.keys', privateKey }
  const source2 = { id: 'native', name: 'Keychain', privateKey }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source1, source2]),
    '../helpers/prompts': { select: sinon.stub().resolves('999') }
  })

  await ct.rejects(
    transfer('.env'),
    /Invalid private key source/
  )
})

t.test('transfer throws when no local source exists and Armor is disabled or unconfigured', async ct => {
  const publicKey = '03pubkey'
  const armoredCustodian = {
    enabled: sinon.stub().returns(false),
    configured: sinon.stub().resolves(false)
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([]),
    '../custodians': {
      get: sinon.stub().withArgs('armored').returns(armoredCustodian)
    }
  })

  await ct.rejects(
    transfer('.env'),
    /private key DOTENV_PRIVATE_KEY not found in local stores; sign in to check Dotenvx Armor/
  )
})

t.test('transfer pulls from Armor when no local source exists and Armor is configured', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const armoredCustodian = {
    id: 'armored',
    name: 'Dotenvx Armor',
    enabled: sinon.stub().returns(true),
    configured: sinon.stub().resolves(true)
  }

  const PostArmorPullStub = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({ private_key: privateKey })
  })

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([]),
    '../custodians': {
      get: sinon.stub().withArgs('armored').returns(armoredCustodian)
    },
    '../api/postArmorPull': PostArmorPullStub,
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/selectKeyStorage': sinon.stub().resolves('armored'),
    '../../db/session': sinon.stub().returns({
      hostname: () => 'https://armor.dotenvx.com',
      token: () => 'token-123',
      devicePublicKey: () => 'device-pub'
    })
  })

  const result = await transfer('.env')

  ct.same(result, {
    changed: false,
    publicKey,
    from: 'Dotenvx Armor',
    to: 'Dotenvx Armor',
    toId: 'armored'
  })
})

t.test('transfer prompts for team when Armor operation requires team selection', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const armoredCustodian = {
    id: 'armored',
    name: 'Dotenvx Armor',
    enabled: sinon.stub().returns(true),
    configured: sinon.stub().resolves(true)
  }

  let callCount = 0
  const PostArmorPullStub = sinon.stub().callsFake(function (hostname, token, deviceKey, pubKey, team) {
    this.run = sinon.stub().callsFake(async () => {
      callCount++
      if (callCount === 1) {
        const teamError = new Error('team required')
        teamError.meta = { teams: ['teamA', 'teamB'] }
        throw teamError
      }
      return { private_key: privateKey }
    })
  })

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([]),
    '../custodians': {
      get: sinon.stub().withArgs('armored').returns(armoredCustodian)
    },
    '../api/postArmorPull': PostArmorPullStub,
    '../helpers/isTeamRequiredError': sinon.stub().callsFake(err => err.message === 'team required'),
    '../helpers/teamChoicesFromMeta': sinon.stub().returns([
      { name: 'Team A', value: 'teamA' },
      { name: 'Team B', value: 'teamB' }
    ]),
    '../helpers/prompts': { select: sinon.stub().resolves('teamA') },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/selectKeyStorage': sinon.stub().resolves('armored'),
    '../../db/session': sinon.stub().returns({
      hostname: () => 'https://armor.dotenvx.com',
      token: () => 'token-123',
      devicePublicKey: () => 'device-pub'
    })
  })

  const result = await transfer('.env')
  ct.equal(result.changed, false)
})

t.test('transfer throws when private key does not match public key', async ct => {
  const publicKey = '03pubkey'
  const source = {
    id: 'file',
    name: '.env.keys',
    privateKey: 'wrong-key'
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(false)
  })

  await ct.rejects(
    transfer('.env'),
    /private key does not match the env public key/
  )
})

t.test('transfer returns changed: false when destination is same file by path or inode', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const keysPath = path.resolve('.env.keys')
  const source = {
    id: 'file',
    name: '.env.keys',
    filepath: keysPath,
    privateKey,
    remove: sinon.stub().resolves()
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true)
  })

  const result = await transfer('.env')

  ct.same(result, {
    changed: false,
    publicKey,
    from: '.env.keys',
    to: '.env.keys',
    toId: 'file'
  })
})

t.test('transfer to file throws when destination contains a conflicting private key', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const source = {
    id: 'native',
    name: 'Keychain',
    privateKey,
    remove: sinon.stub().resolves()
  }

  const readEnvKeyStub = sinon.stub()
  readEnvKeyStub.withArgs('DOTENV_PUBLIC_KEY', '.env', { strict: true }).returns(publicKey)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/)).returns('conflicting-key')

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': readEnvKeyStub,
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true)
  })

  await ct.rejects(
    transfer('.env'),
    /destination contains a different private key; nothing was changed/
  )
})

t.test('transfer to file creates keys file and removes source when file does not exist', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const removeStub = sinon.stub().resolves()
  const source = {
    id: 'native',
    name: 'Keychain',
    privateKey,
    remove: removeStub
  }

  const readEnvKeyStub = sinon.stub()
  readEnvKeyStub.withArgs('DOTENV_PUBLIC_KEY', '.env', { strict: true }).returns(publicKey)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/)).onFirstCall().returns(undefined)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/), { strict: true }).returns(privateKey)

  const writeKeyFileSyncStub = sinon.stub()
  const mutateKeysSrcStub = sinon.stub().returns({ keysSrc: 'DOTENV_PRIVATE_KEY=privkey\n' })

  const fsStub = {
    existsSync: sinon.stub().returns(false),
    statSync: sinon.stub().returns({ size: 0 })
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    'node:fs': fsStub,
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': readEnvKeyStub,
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/cryptography/mutateKeysSrc': mutateKeysSrcStub,
    '../helpers/fsx': { writeKeyFileSync: writeKeyFileSyncStub }
  })

  const result = await transfer('.env')

  ct.ok(mutateKeysSrcStub.calledOnce)
  ct.ok(writeKeyFileSyncStub.calledWith(sinon.match(/\.env\.keys$/), 'DOTENV_PRIVATE_KEY=privkey\n'))
  ct.ok(removeStub.calledOnce)
  ct.same(result, {
    changed: true,
    publicKey,
    from: 'Keychain',
    to: '.env.keys',
    toId: 'file'
  })
})

t.test('transfer to file upserts key when destination file already exists', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const removeStub = sinon.stub().resolves()
  const source = {
    id: 'native',
    name: 'Keychain',
    privateKey,
    remove: removeStub
  }

  const readEnvKeyStub = sinon.stub()
  readEnvKeyStub.withArgs('DOTENV_PUBLIC_KEY', '.env', { strict: true }).returns(publicKey)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/)).onFirstCall().returns(undefined)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/), { strict: true }).returns(privateKey)

  const upsertEnvKeyStub = sinon.stub()

  const fsStub = {
    existsSync: sinon.stub().returns(true),
    statSync: sinon.stub().returns({ size: 100 })
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    'node:fs': fsStub,
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': readEnvKeyStub,
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/upsertEnvKey': upsertEnvKeyStub
  })

  const result = await transfer('.env')

  ct.ok(upsertEnvKeyStub.calledWith('DOTENV_PRIVATE_KEY', privateKey, sinon.match(/\.env\.keys$/)))
  ct.ok(removeStub.calledOnce)
  ct.equal(result.changed, true)
})

t.test('transfer to file throws when destination verification fails', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const source = {
    id: 'native',
    name: 'Keychain',
    privateKey,
    remove: sinon.stub().resolves()
  }

  const readEnvKeyStub = sinon.stub()
  readEnvKeyStub.withArgs('DOTENV_PUBLIC_KEY', '.env', { strict: true }).returns(publicKey)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/)).onFirstCall().returns(undefined)
  readEnvKeyStub.withArgs('DOTENV_PRIVATE_KEY', sinon.match(/\.env\.keys$/), { strict: true }).returns('unverified')

  const fsStub = {
    existsSync: sinon.stub().returns(true),
    statSync: sinon.stub().returns({ size: 100 })
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    'node:fs': fsStub,
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': readEnvKeyStub,
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('file'),
    '../custodians': {
      get: sinon.stub().withArgs('file').returns({ id: 'file', name: '.env.keys' })
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/upsertEnvKey': sinon.stub()
  })

  await ct.rejects(
    transfer('.env'),
    /could not verify destination; source was not removed/
  )
})

t.test('transfer to armored destination stores, verifies, and removes source', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const removeStub = sinon.stub().resolves()
  const source = {
    id: 'file',
    name: '.env.keys',
    privateKey,
    remove: removeStub
  }

  const armoredDestination = {
    id: 'armored',
    name: 'Dotenvx Armor',
    store: sinon.stub().resolves()
  }

  const PostArmorPullStub = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({ private_key: privateKey })
  })

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('armored'),
    '../custodians': {
      get: sinon.stub().withArgs('armored').returns(armoredDestination)
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../api/postArmorPull': PostArmorPullStub,
    '../../db/session': sinon.stub().returns({
      hostname: () => 'https://armor.dotenvx.com',
      token: () => 'token-123',
      devicePublicKey: () => 'device-pub'
    })
  })

  const result = await transfer('.env')

  ct.ok(armoredDestination.store.calledWith(publicKey, privateKey, { envFilepath: '.env' }))
  ct.ok(removeStub.calledOnce)
  ct.same(result, {
    changed: true,
    publicKey,
    from: '.env.keys',
    to: 'Dotenvx Armor',
    toId: 'armored'
  })
})

t.test('transfer to generic custodian destination sets, verifies, and removes source', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const removeStub = sinon.stub().resolves()
  const source = {
    id: 'file',
    name: '.env.keys',
    privateKey,
    remove: removeStub
  }

  const nativeDestination = {
    id: 'native',
    name: 'Keychain',
    get: sinon.stub()
      .onFirstCall().resolves({})
      .onSecondCall().resolves({ [publicKey]: privateKey }),
    set: sinon.stub().resolves()
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('native'),
    '../custodians': {
      get: sinon.stub().withArgs('native').returns(nativeDestination)
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true)
  })

  const result = await transfer('.env')

  ct.ok(nativeDestination.set.calledWith(publicKey, privateKey))
  ct.ok(removeStub.calledOnce)
  ct.same(result, {
    changed: true,
    publicKey,
    from: '.env.keys',
    to: 'Keychain',
    toId: 'native'
  })
})

t.test('transfer throws when generic custodian destination contains a different key', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const source = {
    id: 'file',
    name: '.env.keys',
    privateKey,
    remove: sinon.stub().resolves()
  }

  const nativeDestination = {
    id: 'native',
    name: 'Keychain',
    get: sinon.stub().resolves({ [publicKey]: 'other-key' })
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('native'),
    '../custodians': {
      get: sinon.stub().withArgs('native').returns(nativeDestination)
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true)
  })

  await ct.rejects(
    transfer('.env'),
    /destination contains a different private key; nothing was changed/
  )
})

t.test('transfer throws when source.remove() fails leaving both copies', async ct => {
  const publicKey = '03pubkey'
  const privateKey = 'privkey'
  const removeError = new Error('permission denied')
  const source = {
    id: 'file',
    name: '.env.keys',
    privateKey,
    remove: sinon.stub().rejects(removeError)
  }

  const nativeDestination = {
    id: 'native',
    name: 'Keychain',
    get: sinon.stub()
      .onFirstCall().resolves({})
      .onSecondCall().resolves({ [publicKey]: privateKey }),
    set: sinon.stub().resolves()
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([source]),
    '../helpers/selectKeyStorage': sinon.stub().resolves('native'),
    '../custodians': {
      get: sinon.stub().withArgs('native').returns(nativeDestination)
    },
    '../helpers/matchesStoredKey': sinon.stub().returns(true)
  })

  await ct.rejects(
    transfer('.env'),
    /private key saved in Keychain, but could not remove it from \.env\.keys; both copies remain/
  )
})

t.test('transfer Armor source removal throws if private key changed before removal', async ct => {
  const publicKey = '03pubkey'
  const initialPrivateKey = 'initial-key'
  const armoredCustodian = {
    id: 'armored',
    name: 'Dotenvx Armor',
    enabled: sinon.stub().returns(true),
    configured: sinon.stub().resolves(true)
  }

  let pullCount = 0
  const PostArmorPullStub = sinon.stub().callsFake(function () {
    this.run = sinon.stub().callsFake(async () => {
      pullCount++
      if (pullCount === 1) return { private_key: initialPrivateKey }
      return { private_key: 'mutated-key' } // changed on second pull
    })
  })

  const nativeDestination = {
    id: 'native',
    name: 'Keychain',
    get: sinon.stub()
      .onFirstCall().resolves({})
      .onSecondCall().resolves({ [publicKey]: initialPrivateKey }),
    set: sinon.stub().resolves()
  }

  const transfer = proxyquire('../../../src/lib/services/transfer', {
    '../conventions/keynames': defaultKeynames,
    '../helpers/readEnvKey': sinon.stub().returns(publicKey),
    '../custodians/resolveLocalKey': sinon.stub().resolves([]),
    '../custodians': {
      get: sinon.stub().callsFake(id => id === 'armored' ? armoredCustodian : nativeDestination)
    },
    '../api/postArmorPull': PostArmorPullStub,
    '../api/postArmorDown': sinon.stub(),
    '../helpers/matchesStoredKey': sinon.stub().returns(true),
    '../helpers/selectKeyStorage': sinon.stub().resolves('native'),
    '../../db/session': sinon.stub().returns({
      hostname: () => 'https://armor.dotenvx.com',
      token: () => 'token-123',
      devicePublicKey: () => 'device-pub'
    })
  })

  await ct.rejects(
    transfer('.env'),
    /could not remove it from Dotenvx Armor; both copies remain/
  )
})
