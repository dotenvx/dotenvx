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
  const spawnSync = sinon.stub().returns({ status: 0, stderr: Buffer.alloc(0) })
  const keychain = proxyquire(helperPath, {
    child_process: { spawnSync }
  })

  keychain.set('public-key', 'private-key', 'dotenvx (PUB LIC)')

  t.same(spawnSync.firstCall.args, ['/usr/bin/security', ['-i'], {
    input: '"add-generic-password" "-U" "-s" "dotenvx" "-a" "public-key" "-l" "dotenvx (PUB LIC)" "-w" "private-key"\n',
    timeout: 10000,
    killSignal: 'SIGKILL',
    stdio: ['pipe', 'ignore', 'pipe']
  }])
  t.end()
})

t.test('quotes input for the security parser without shell evaluation', t => {
  const spawnSync = sinon.stub().returns({ status: 0, stderr: Buffer.alloc(0) })
  const keychain = proxyquire(helperPath, { child_process: { spawnSync } })
  keychain.set('public-key', 'secret"\\value', "label ' $(ignored); value")
  t.same(spawnSync.firstCall.args[1], ['-i'])
  t.equal(spawnSync.firstCall.args[2].input, '"add-generic-password" "-U" "-s" "dotenvx" "-a" "public-key" "-l" "label \' $(ignored); value" "-w" "secret\\"\\\\value"\n')
  t.end()
})

t.test('rejects command injection and oversized input before spawning', t => {
  const spawnSync = sinon.stub()
  const keychain = proxyquire(helperPath, { child_process: { spawnSync } })
  for (const invalid of ['bad\nhelp', 'bad\rhelp', 'bad\0value', 'x'.repeat(4096), 'é'.repeat(2048)]) {
    for (let index = 0; index < 3; index++) {
      const args = ['public-key', 'private-key', 'label']
      args[index] = invalid
      t.throws(() => keychain.set(...args), { code: 'NATIVE_ACCESS_FAILED', message: 'failed to save private key to macOS Keychain' })
    }
  }
  t.equal(spawnSync.callCount, 0)
  t.end()
})

t.test('write failures are sanitized and preserve unavailable classification', t => {
  for (const code of ['ENOENT', 'ETIMEDOUT', undefined]) {
    const spawnSync = sinon.stub().returns({ error: Object.assign(new Error('private-key'), { code, stderr: 'private-key' }) })
    const keychain = proxyquire(helperPath, { child_process: { spawnSync } })
    t.throws(() => keychain.set('public-key', 'private-key', 'label'), {
      message: 'failed to save private key to macOS Keychain',
      code: code === 'ENOENT' ? 'NATIVE_UNAVAILABLE' : 'NATIVE_ACCESS_FAILED'
    })
  }
  t.end()
})

t.test('rejects failed status, signals, and zero-exit diagnostics without leaking output', t => {
  for (const result of [
    { status: 1, stderr: Buffer.alloc(0) },
    { status: null, signal: 'SIGKILL', stderr: Buffer.alloc(0) },
    { status: 0, stderr: Buffer.from('private-key') }
  ]) {
    const keychain = proxyquire(helperPath, { child_process: { spawnSync: sinon.stub().returns(result) } })
    t.throws(() => keychain.set('public-key', 'private-key', 'label'), {
      message: 'failed to save private key to macOS Keychain',
      code: 'NATIVE_ACCESS_FAILED'
    })
  }
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
