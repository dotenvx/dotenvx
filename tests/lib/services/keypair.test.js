const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const Keypair = require('../../../src/lib/services/keypair')

let writeFileSyncStub

t.beforeEach((ct) => {
  process.env = {}
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#runSync (no arguments)',
  async ct => {
    const result = new Keypair().runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

    ct.end()
  })

t.test('#runSync (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair(envFile).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#runSync (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair([envFile]).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (no arguments)',
  async ct => {
    const result = await new Keypair().run()

    ct.same(result, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair(envFile).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair([envFile]).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run forwards command to key resolution',
  async ct => {
    const keyValues = sinon.stub().resolves({
      publicKeyValue: 'public-key',
      privateKeyValue: 'private-key'
    })
    const keyValuesSync = sinon.stub().returns({
      publicKeyValue: 'public-key-sync',
      privateKeyValue: 'private-key-sync'
    })
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
      './../helpers/keyResolution/keyNamesForEnvFile': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/keyResolution/keyValues': keyValues,
      './../helpers/keyResolution/keyValuesSync': keyValuesSync
    })

    const out = await new KeypairWithStubs('.env', null, false, { command: ['keypair'] }).run()
    const outSync = new KeypairWithStubs('.env', null, false, { command: ['keypair'] }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key-sync', DOTENV_PRIVATE_KEY: 'private-key-sync' })
    ct.same(keyValues.firstCall.args[1], { keysFilepath: null, noArmor: false, command: ['keypair'] })
    ct.same(keyValuesSync.firstCall.args[1], { keysFilepath: null, noArmor: false, command: ['keypair'] })
    ct.end()
  })

t.test('#run uses remote keypair when token is provided and no local keys exist',
  async ct => {
    const keyValues = sinon.stub().resolves({
      publicKeyValue: null,
      privateKeyValue: null
    })
    const keyValuesSync = sinon.stub().returns({
      publicKeyValue: null,
      privateKeyValue: null
    })
    const armorKeypair = sinon.stub().resolves({
      publicKey: 'remote-public-key',
      privateKey: 'remote-private-key'
    })
    const armorKeypairSync = sinon.stub().returns({
      publicKey: 'remote-public-key-sync',
      privateKey: 'remote-private-key-sync'
    })
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
      './../helpers/keyResolution/keyNamesForEnvFile': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/keyResolution/keyValues': keyValues,
      './../helpers/keyResolution/keyValuesSync': keyValuesSync,
      './../helpers/cryptography/armorKeypair': armorKeypair,
      './../helpers/cryptography/armorKeypairSync': armorKeypairSync
    })

    const out = await new KeypairWithStubs('.env', null, false, {
      command: ['keypair'],
      hostname: 'https://armor.example.com',
      token: 'token-123',
      team: 'acme',
      metadata: '{"command":"dotenvx run -- npm start"}'
    }).run()
    const outSync = new KeypairWithStubs('.env', null, false, {
      command: ['keypair'],
      hostname: 'https://armor.example.com',
      token: 'token-123',
      team: 'acme',
      metadata: '{"command":"dotenvx run -- npm start"}'
    }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'remote-public-key', DOTENV_PRIVATE_KEY: 'remote-private-key' })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'remote-public-key-sync', DOTENV_PRIVATE_KEY: 'remote-private-key-sync' })
    ct.same(armorKeypair.firstCall.args, [undefined, {
      envFilepath: '.env',
      command: ['keypair'],
      hostname: 'https://armor.example.com',
      token: 'token-123',
      team: 'acme',
      metadata: '{"command":"dotenvx run -- npm start"}'
    }])
    ct.same(armorKeypairSync.firstCall.args, [undefined, {
      envFilepath: '.env',
      command: ['keypair'],
      hostname: 'https://armor.example.com',
      token: 'token-123',
      team: 'acme',
      metadata: '{"command":"dotenvx run -- npm start"}'
    }])
    ct.end()
  })

t.test('#run uses remote keypair with explicit public key',
  async ct => {
    const keyValues = sinon.stub().resolves({
      publicKeyValue: null,
      privateKeyValue: null
    })
    const keyValuesSync = sinon.stub().returns({
      publicKeyValue: null,
      privateKeyValue: null
    })
    const armorKeypair = sinon.stub().resolves({
      privateKey: 'remote-private-key'
    })
    const armorKeypairSync = sinon.stub().returns({
      privateKey: 'remote-private-key-sync'
    })
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
      './../helpers/keyResolution/keyNamesForEnvFile': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/keyResolution/keyValues': keyValues,
      './../helpers/keyResolution/keyValuesSync': keyValuesSync,
      './../helpers/cryptography/armorKeypair': armorKeypair,
      './../helpers/cryptography/armorKeypairSync': armorKeypairSync
    })

    const out = await new KeypairWithStubs('.env', null, false, {
      publicKey: 'existing-public-key'
    }).run()
    const outSync = new KeypairWithStubs('.env', null, false, {
      publicKey: 'existing-public-key'
    }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'existing-public-key', DOTENV_PRIVATE_KEY: 'remote-private-key' })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'existing-public-key', DOTENV_PRIVATE_KEY: 'remote-private-key-sync' })
    ct.same(armorKeypair.firstCall.args[0], 'existing-public-key')
    ct.same(armorKeypairSync.firstCall.args[0], 'existing-public-key')
    ct.end()
  })
