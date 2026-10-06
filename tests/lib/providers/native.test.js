const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform')

function setPlatform (value) {
  Object.defineProperty(process, 'platform', {
    value
  })
}

t.afterEach(() => {
  sinon.restore()
  Object.defineProperty(process, 'platform', platformDescriptor)
})

t.test('native provider is disabled outside supported platforms', async ct => {
  const provider = require('../../../src/lib/custodians/local/native/backend')
  setPlatform('freebsd')

  ct.same(provider('public-key'), {})
  ct.same(await provider.async('public-key'), {})
})

t.test('native backend reads raw secrets from macOS Keychain on darwin', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/macosKeychain': { get }
  })

  setPlatform('darwin')

  ct.equal(provider.get('public-key'), 'private-key')
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native backend reads raw secrets from Windows Credential Manager on win32', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/windowsCredentialManager': { get }
  })

  setPlatform('win32')

  ct.equal(provider.get('public-key'), 'private-key')
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native backend reads raw secrets from Linux Secret Service on linux', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/linuxSecretService': { get }
  })

  setPlatform('linux')

  ct.equal(provider.get('public-key'), 'private-key')
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

for (const method of ['sync', 'async']) {
  t.test(`native provider delegates ${method} key lookup to @dotenvx/providers`, async ct => {
    const ring = { 'public-key': 'private-key' }
    const get = sinon.stub().resolves(ring)
    const getSync = sinon.stub().returns(ring)
    const native = sinon.stub().returns({ get, getSync })
    const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
      '@dotenvx/providers': { native }
    })
    const lookup = method === 'async' ? provider.async : provider
    const used = method === 'async' ? get : getSync
    const unused = method === 'async' ? getSync : get

    ct.same(await lookup('public-key'), ring)
    ct.same(used.firstCall.args, ['public-key'])
    ct.equal(unused.callCount, 0)
    ct.equal(native.callCount, 1)

    used.resetBehavior()
    if (method === 'async') used.resolves({})
    else used.returns({})
    ct.same(await lookup('missing-key'), {})
    ct.same(used.secondCall.args, ['missing-key'])
  })
}

t.test('native provider writes macOS Keychain on darwin', ct => {
  const set = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/macosKeychain': { set }
  })

  setPlatform('darwin')
  provider.set('public-key', 'private-key', 'dotenvx (PUB LIC)')

  ct.same(set.firstCall.args, ['public-key', 'private-key', 'dotenvx (PUB LIC)'])
  ct.end()
})

t.test('native provider defaults secret label to key', ct => {
  const set = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/macosKeychain': { set }
  })

  setPlatform('darwin')
  provider.set('DOTENVX_ARMOR_TOKEN', 'token-123')

  ct.same(set.firstCall.args, ['DOTENVX_ARMOR_TOKEN', 'token-123', 'DOTENVX_ARMOR_TOKEN'])
  ct.end()
})

t.test('native provider writes Windows Credential Manager on win32', ct => {
  const set = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/windowsCredentialManager': { set }
  })

  setPlatform('win32')
  provider.set('public-key', 'private-key', 'dotenvx (PUB LIC)')

  ct.same(set.firstCall.args, ['public-key', 'private-key', 'dotenvx (PUB LIC)'])
  ct.end()
})

t.test('native provider writes Linux Secret Service on linux', ct => {
  const set = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/linuxSecretService': { set }
  })

  setPlatform('linux')
  provider.set('public-key', 'private-key', 'dotenvx (PUB LIC)')

  ct.same(set.firstCall.args, ['public-key', 'private-key', 'dotenvx (PUB LIC)'])
  ct.end()
})

t.test('native provider deletes macOS Keychain item on darwin', ct => {
  const deleteSecret = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/macosKeychain': { delete: deleteSecret }
  })

  setPlatform('darwin')
  provider.delete('public-key')

  ct.same(deleteSecret.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native provider deletes Windows Credential Manager item on win32', ct => {
  const deleteSecret = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/windowsCredentialManager': { delete: deleteSecret }
  })

  setPlatform('win32')
  provider.delete('public-key')

  ct.same(deleteSecret.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native provider deletes Linux Secret Service item on linux', ct => {
  const deleteSecret = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/linuxSecretService': { delete: deleteSecret }
  })

  setPlatform('linux')
  provider.delete('public-key')

  ct.same(deleteSecret.firstCall.args, ['public-key'])
  ct.end()
})
