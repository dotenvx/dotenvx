const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const VaultDecrypt = require('../../../../../src/lib/services/vaultDecrypt')
const { logger } = require('../../../../../src/shared/logger')

const vaultDecrypt = require('../../../../../src/cli/actions/ext/vault/decrypt')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('vaultDecrypt - nothing', ct => {
  const stub = sinon.stub(VaultDecrypt.prototype, 'run').returns({
    processedEnvs: [],
    changedFilenames: [],
    unchangedFilenames: []
  })

  vaultDecrypt.call(fakeContext, '.')

  ct.ok(stub.called, 'VaultDecrypt().run() called')

  ct.end()
})

t.test('vaultDecrypt - .env', ct => {
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  const stub = sinon.stub(VaultDecrypt.prototype, 'run').returns({
    processedEnvs: [{
      shouldWrite: true,
      filepath: '.env',
      decrypted: 'HELLO=World',
      filename: '.env'
    }],
    changedFilenames: ['.env'],
    unchangedFilenames: []
  })

  vaultDecrypt.call(fakeContext, '.')

  ct.ok(stub.called, 'VaultDecrypt().run() called')
  ct.ok(writeFileSyncStub.called, 'fs.writeFileSync() called')

  ct.end()
})

t.test('vaultDecrypt - .env no changes', ct => {
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  const stub = sinon.stub(VaultDecrypt.prototype, 'run').returns({
    processedEnvs: [{
      shouldWrite: false,
      filepath: '.env',
      decrypted: 'HELLO=World',
      filename: '.env'
    }],
    changedFilenames: [],
    unchangedFilenames: ['.env']
  })
  const loggerDebugStub = sinon.stub(logger, 'debug')

  vaultDecrypt.call(fakeContext, '.')

  ct.ok(stub.called, 'VaultDecrypt().run() called')
  ct.ok(writeFileSyncStub.notCalled, 'fs.writeFileSync() not called')
  ct.ok(loggerDebugStub.calledWith('no changes for .env'), 'logger.debug called')

  ct.end()
})

t.test('vaultDecrypt - .env with warning', ct => {
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  const stub = sinon.stub(VaultDecrypt.prototype, 'run').returns({
    processedEnvs: [{
      warning: new Error('Mock Warning')
    }],
    changedFilenames: [],
    unchangedFilenames: []
  })
  const loggerWarnStub = sinon.stub(logger, 'warn')

  vaultDecrypt.call(fakeContext, '.')

  ct.ok(stub.called, 'VaultDecrypt().run() called')
  ct.ok(writeFileSyncStub.notCalled, 'fs.writeFileSync() not called')
  ct.ok(loggerWarnStub.calledWith('Mock Warning'), 'logger.warn called')

  ct.end()
})

t.test('vaultDecrypt - when error', ct => {
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const stub = sinon.stub(VaultDecrypt.prototype, 'run').throws(error)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  vaultDecrypt.call(fakeContext, '.')

  ct.ok(stub.called, 'VaultDecrypt().run() called')
  ct.ok(processExitStub.calledWith(1), 'process.exit was called with code 1')
  ct.ok(loggerHelpStub.calledWith('Mock Help'), 'logger.help logs')
  ct.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger.debug logs')

  ct.end()
})
