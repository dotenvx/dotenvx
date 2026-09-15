const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const helperPath = '../../../src/lib/helpers/macosKeychain'

t.afterEach(() => {
  sinon.restore()
})

t.test('reads a generic password through security', t => {
  const execFileSync = sinon.stub().returns('private-key\n')
  const keychain = proxyquire(helperPath, {
    child_process: { execFileSync }
  })

  t.equal(keychain.get('public-key'), 'private-key')
  t.same(execFileSync.firstCall.args, ['/usr/bin/security', ['find-generic-password', '-s', 'dotenvx', '-a', 'public-key', '-w'], {
    timeout: 10000,
    killSignal: 'SIGKILL',
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }])
  t.end()
})

t.test('writes a generic password through security', t => {
  const execFileSync = sinon.stub()
  const keychain = proxyquire(helperPath, {
    child_process: { execFileSync }
  })

  keychain.set('public-key', 'private-key', 'dotenvx (PUB LIC)')

  t.same(execFileSync.firstCall.args, ['/usr/bin/security', ['add-generic-password', '-U', '-s', 'dotenvx', '-a', 'public-key', '-l', 'dotenvx (PUB LIC)', '-w', 'private-key'], { timeout: 10000, killSignal: 'SIGKILL', stdio: 'ignore' }])
  t.end()
})

t.test('deletes a generic password through security', t => {
  const execFileSync = sinon.stub()
  const keychain = proxyquire(helperPath, {
    child_process: { execFileSync }
  })

  keychain.delete('public-key')

  t.same(execFileSync.firstCall.args, ['/usr/bin/security', ['delete-generic-password', '-s', 'dotenvx', '-a', 'public-key'], { timeout: 10000, killSignal: 'SIGKILL', stdio: 'ignore' }])
  t.end()
})
