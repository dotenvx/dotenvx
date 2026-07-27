const t = require('tap')
const sinon = require('sinon')

const readEnvKeyPath = require.resolve('../../../src/lib/helpers/readEnvKey')
const armorOpenPath = require.resolve('../../../src/lib/services/armorOpen')

function loadArmorOpenWithStubs ({ readEnvKeyExport }) {
  const originalReadEnvKey = require(readEnvKeyPath)

  require.cache[readEnvKeyPath].exports = readEnvKeyExport
  delete require.cache[armorOpenPath]
  require(armorOpenPath)

  return () => {
    require.cache[readEnvKeyPath].exports = originalReadEnvKey
    delete require.cache[armorOpenPath]
  }
}

t.test('ArmorOpen builds go url from public key in .env by default', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71')
  const restore = loadArmorOpenWithStubs({
    readEnvKeyExport: getStub
  })
  const ArmorOpen = require(armorOpenPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = new ArmorOpen('https://armor.dotenvx.com').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY', '.env', {
    strict: true
  }], 'reads DOTENV_PUBLIC_KEY from .env')
  ct.same(result, {
    url: 'https://armor.dotenvx.com/go/arm_027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71'
  }, 'returns go url for armored key')
})

t.test('ArmorOpen uses environment public key name for non-default env file', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('03aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  const restore = loadArmorOpenWithStubs({
    readEnvKeyExport: getStub
  })
  const ArmorOpen = require(armorOpenPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = new ArmorOpen('https://armor.dotenvx.com', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY_PRODUCTION', '.env.production', {
    strict: true
  }], 'reads production public key from env file')
  ct.equal(result.url, 'https://armor.dotenvx.com/go/arm_03aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  ct.equal(result.publicKeyName, 'DOTENV_PUBLIC_KEY_PRODUCTION')
})
