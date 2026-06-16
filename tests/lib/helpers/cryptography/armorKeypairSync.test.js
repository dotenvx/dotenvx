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

t.test('armorKeypairSync runs native dotenvx armor keypair command', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    public_key: 'armor_pub_123',
    private_key: 'armor_priv_123'
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
    'armor',
    'keypair',
    '--no-spinner'
  ], {
    stdio: ['inherit', 'pipe', 'inherit']
  }])
  ct.end()
})

t.test('armorKeypairSync forwards public key and options to native command', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  const out = armorKeypairSync('existing_pub', {
    token: 'token-123',
    envFilepath: '.env.production',
    command: ['dotenvx', 'run', '-f', '.env.production', '--', 'npm', 'start']
  })

  ct.same(out, {
    publicKey: 'armor_pub_abc',
    privateKey: 'armor_priv_abc'
  })
  ct.same(execFileSync.firstCall.args[1], [
    expectedCliPath,
    'armor',
    'keypair',
    '--no-spinner',
    '--token',
    'token-123',
    '-f',
    '.env.production',
    '--metadata',
    '{"command":"dotenvx run -f .env.production -- npm start"}',
    'existing_pub'
  ])
  ct.end()
})

t.test('armorKeypairSync forwards string command as metadata json', ct => {
  const execFileSync = sinon.stub().returns(Buffer.from(JSON.stringify({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })))
  const armorKeypairSync = loadArmorKeypairSync(execFileSync)

  armorKeypairSync('existing_pub', {
    command: 'dotenvx config'
  })

  ct.same(execFileSync.firstCall.args[1], [
    expectedCliPath,
    'armor',
    'keypair',
    '--no-spinner',
    '--metadata',
    '{"command":"dotenvx config"}',
    'existing_pub'
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
