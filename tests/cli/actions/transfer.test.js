const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { logger } = require('../../../src/shared/logger')

t.beforeEach(() => {
  sinon.restore()
})

t.test('transfer action requires interactive terminal (CI check)', async ct => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const originalCI = process.env.CI
  process.env.CI = 'true'

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {})
    const result = await transferAction.call({ opts: () => ({}) })

    ct.equal(result.exitCode, 1)
    ct.ok(loggerErrorStub.calledWith('Run [dotenvx transfer] in an interactive terminal'))
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
  }
})

t.test('transfer action requires interactive terminal (isTTY check)', async ct => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const originalCI = process.env.CI
  delete process.env.CI

  const originalStdinTTY = process.stdin.isTTY
  const originalStderrTTY = process.stderr.isTTY
  process.stdin.isTTY = false
  process.stderr.isTTY = true

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {})
    const result = await transferAction.call({ opts: () => ({}) })

    ct.equal(result.exitCode, 1)
    ct.ok(loggerErrorStub.calledWith('Run [dotenvx transfer] in an interactive terminal'))
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    process.stdin.isTTY = originalStdinTTY
    process.stderr.isTTY = originalStderrTTY
  }
})

t.test('transfer action logs success when changed is true', async ct => {
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const originalCI = process.env.CI
  delete process.env.CI

  const originalStdinTTY = process.stdin.isTTY
  const originalStderrTTY = process.stderr.isTTY
  process.stdin.isTTY = true
  process.stderr.isTTY = true

  const transferStub = sinon.stub().resolves({
    changed: true,
    publicKey: '031234567890abcdef',
    from: 'Keychain',
    to: '.env.keys',
    toId: 'file'
  })

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {
      '../../lib/services/transfer': transferStub
    })

    await transferAction.call({ opts: () => ({ envFile: '.env.production' }) })

    ct.ok(transferStub.calledWith('.env.production'))
    ct.ok(loggerSuccessStub.calledOnce)
    ct.match(loggerSuccessStub.firstCall.args[0], /transferred/)
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    process.stdin.isTTY = originalStdinTTY
    process.stderr.isTTY = originalStderrTTY
  }
})

t.test('transfer action logs info when changed is false', async ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const originalCI = process.env.CI
  delete process.env.CI

  const originalStdinTTY = process.stdin.isTTY
  const originalStderrTTY = process.stderr.isTTY
  process.stdin.isTTY = true
  process.stderr.isTTY = true

  const transferStub = sinon.stub().resolves({
    changed: false,
    publicKey: '031234567890abcdef',
    from: '.env.keys',
    to: '.env.keys',
    toId: 'file'
  })

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {
      '../../lib/services/transfer': transferStub
    })

    await transferAction.call({ opts: () => ({}) })

    ct.ok(transferStub.calledWith('.env'))
    ct.ok(loggerInfoStub.calledOnce)
    ct.match(loggerInfoStub.firstCall.args[0], /no change/)
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    process.stdin.isTTY = originalStdinTTY
    process.stderr.isTTY = originalStderrTTY
  }
})

t.test('transfer action handles PROMPT_CANCELLED without error log', async ct => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const originalCI = process.env.CI
  delete process.env.CI

  const originalStdinTTY = process.stdin.isTTY
  const originalStderrTTY = process.stderr.isTTY
  process.stdin.isTTY = true
  process.stderr.isTTY = true

  const cancelledError = new Error('cancelled')
  cancelledError.code = 'PROMPT_CANCELLED'

  const transferStub = sinon.stub().rejects(cancelledError)

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {
      '../../lib/services/transfer': transferStub
    })

    const result = await transferAction.call({ opts: () => ({}) })

    ct.equal(result.exitCode, 130)
    ct.equal(loggerErrorStub.callCount, 0)
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    process.stdin.isTTY = originalStdinTTY
    process.stderr.isTTY = originalStderrTTY
  }
})

t.test('transfer action logs error and returns exitCode 1 on general error', async ct => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const originalCI = process.env.CI
  delete process.env.CI

  const originalStdinTTY = process.stdin.isTTY
  const originalStderrTTY = process.stderr.isTTY
  process.stdin.isTTY = true
  process.stderr.isTTY = true

  const error = new Error('custom transfer failure')
  error.messageWithHelp = '[ERROR] custom transfer failure with help'

  const transferStub = sinon.stub().rejects(error)

  try {
    const transferAction = proxyquire('../../../src/cli/actions/transfer', {
      '../../lib/services/transfer': transferStub
    })

    const result = await transferAction.call({ opts: () => ({}) })

    ct.equal(result.exitCode, 1)
    ct.ok(loggerErrorStub.calledWith('[ERROR] custom transfer failure with help'))
  } finally {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    process.stdin.isTTY = originalStdinTTY
    process.stderr.isTTY = originalStderrTTY
  }
})
