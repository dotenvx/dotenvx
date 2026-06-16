const path = require('path')
const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const expectedCliPath = path.resolve(process.cwd(), 'src/cli/dotenvx.js')

function loadArmorKeypairSync (execFileSync) {
  return proxyquire('../../../../src/lib/helpers/cryptography/armorKeypairSync', {
    child_process: { execFileSync }
  })
}

t.test('armorKeypairSync runs dotenvx keypair command for blocking approval flow', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    DOTENV_PUBLIC_KEY: 'armor_pub_123',
    DOTENV_PRIVATE_KEY: 'armor_priv_123'
  })))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  const out = armorKeypairSync()

  ct.same(out, {
    publicKey: 'armor_pub_123',
    privateKey: 'armor_priv_123'
  })
  ct.equal(execFileSync.callCount, 1)
  ct.same(execFileSync.firstCall.args, [process.execPath, [
    expectedCliPath,
    'keypair',
    '--format',
    'json'
  ], {
    stdio: ['inherit', 'pipe', 'inherit'],
    timeout: 5 * 60 * 1000
  }])
  ct.end()
})

t.test('armorKeypairSync forwards env filepath to read-only keypair command', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    DOTENV_PUBLIC_KEY_PRODUCTION: 'armor_pub_abc',
    DOTENV_PRIVATE_KEY_PRODUCTION: 'armor_priv_abc'
  })))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  const out = armorKeypairSync('existing_pub', { envFilepath: '.env.production' })

  ct.same(out, {
    publicKey: 'armor_pub_abc',
    privateKey: 'armor_priv_abc'
  })
  ct.same(execFileSync.firstCall.args[1], [
    expectedCliPath,
    'keypair',
    '--format',
    'json',
    '-f',
    '.env.production'
  ])
  ct.end()
})

t.test('armorKeypairSync does not pass command metadata through public keypair command', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    DOTENV_PUBLIC_KEY: 'armor_pub_abc',
    DOTENV_PRIVATE_KEY: 'armor_priv_abc'
  })))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  armorKeypairSync('existing_pub', {
    command: 'dotenvx config'
  })

  ct.same(execFileSync.firstCall.args[1], [
    expectedCliPath,
    'keypair',
    '--format',
    'json'
  ])
  ct.end()
})

t.test('armorKeypairSync returns empty keys when native command fails or returns invalid json', ct => {
  const execFileSync = sinon.stub().throws(new Error('nope'))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  const out = armorKeypairSync('existing_pub')

  ct.same(out, {
    publicKey: undefined,
    privateKey: undefined
  })
  ct.end()
})

t.test('armorKeypairSync returns empty keys when native command returns no key names', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({})))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  const out = armorKeypairSync('existing_pub')

  ct.same(out, {
    publicKey: undefined,
    privateKey: undefined
  })
  ct.end()
})
