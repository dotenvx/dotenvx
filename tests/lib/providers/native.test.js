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

t.test('native provider is disabled outside supported platforms', ct => {
  const execFileSync = sinon.stub()
  const getWindowsCredential = sinon.stub()
  const getLinuxSecret = sinon.stub()
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    child_process: { execFileSync },
    '../../../helpers/windowsCredentialManager': { get: getWindowsCredential },
    '../../../helpers/linuxSecretService': { get: getLinuxSecret }
  })

  setPlatform('freebsd')

  ct.same(provider('public-key'), {})
  ct.equal(execFileSync.callCount, 0)
  ct.equal(getWindowsCredential.callCount, 0)
  ct.equal(getLinuxSecret.callCount, 0)
  ct.end()
})

t.test('native provider reads macOS Keychain on darwin', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/macosKeychain': { get }
  })

  setPlatform('darwin')

  ct.same(provider('public-key'), { 'public-key': 'private-key' })
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native provider reads Windows Credential Manager on win32', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/windowsCredentialManager': { get }
  })

  setPlatform('win32')

  ct.same(provider('public-key'), { 'public-key': 'private-key' })
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

t.test('native provider reads Linux Secret Service on linux', ct => {
  const get = sinon.stub().returns('private-key')
  const provider = proxyquire('../../../src/lib/custodians/local/native/backend', {
    '../../../helpers/linuxSecretService': { get }
  })

  setPlatform('linux')

  ct.same(provider('public-key'), { 'public-key': 'private-key' })
  ct.same(get.firstCall.args, ['public-key'])
  ct.end()
})

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
