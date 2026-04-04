const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

function makeNoopLogger () {
  return {
    debug: () => {},
    verbose: () => {},
    successv: () => {},
    error: () => {}
  }
}

t.beforeEach(() => {
  sinon.restore()
  process.env = {}
})

t.test('get stops spinner on success path', async ct => {
  const spinner = { stop: sinon.stub() }
  const consoleLogStub = sinon.stub(console, 'log')

  const get = proxyquire('../../../src/cli/actions/get', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/get': class {
      async run () {
        return { parsed: { HELLO: 'World' }, errors: [] }
      }
    },
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  await get.call({ opts: () => ({}), envs: [] }, 'HELLO')

  t.ok(spinner.stop.calledOnce, 'spinner.stop called once')
  t.ok(consoleLogStub.calledWith('World'), 'prints looked-up key')
  ct.end()
})

t.test('get stops spinner on catch path', async ct => {
  const spinner = { stop: sinon.stub() }
  const boom = new Error('boom')
  const catchAndLogStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')

  const get = proxyquire('../../../src/cli/actions/get', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/get': class {
      async run () {
        throw boom
      }
    },
    '../../../src/lib/helpers/catchAndLog': catchAndLogStub,
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  await get.call({ opts: () => ({}), envs: [] }, 'HELLO')

  t.ok(spinner.stop.calledOnce, 'spinner.stop called in catch branch')
  t.ok(catchAndLogStub.calledWith(boom), 'error logged through catchAndLog')
  t.ok(processExitStub.calledWith(1), 'process.exit(1) called')
  ct.end()
})

t.test('keypair stops spinner before output', async ct => {
  const spinner = { stop: sinon.stub() }
  const consoleLogStub = sinon.stub(console, 'log')

  const keypair = proxyquire('../../../src/cli/actions/keypair', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/keypair': class {
      async run () {
        return { DOTENV_PUBLIC_KEY: '<publicKey>' }
      }
    },
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  await keypair.call({ opts: () => ({}), envs: [] }, 'DOTENV_PUBLIC_KEY')

  t.ok(spinner.stop.calledOnce, 'spinner.stop called once')
  t.ok(consoleLogStub.calledWith('<publicKey>'), 'prints selected keypair value')
  ct.end()
})

t.test('run stops spinner when command missing', async ct => {
  const spinner = { stop: sinon.stub() }
  const processExitStub = sinon.stub(process, 'exit').callsFake(() => {
    throw new Error('EXIT')
  })

  const run = proxyquire('../../../src/cli/actions/run', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/run': class {
      async run () {
        return {
          processedEnvs: [],
          readableStrings: [],
          readableFilepaths: [],
          uniqueInjectedKeys: []
        }
      }
    },
    '../../../src/lib/helpers/executeCommand': async () => true,
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--'])

  await t.rejects(run.call({ opts: () => ({ envFile: [] }), args: [], envs: [] }), /EXIT/)

  t.ok(processExitStub.calledWith(1), 'process.exit(1) called')
  t.ok(spinner.stop.calledOnce, 'spinner.stop called in missing-command branch')
  ct.end()
})

t.test('run stops spinner on success path', async ct => {
  const spinner = { stop: sinon.stub() }

  const run = proxyquire('../../../src/cli/actions/run', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/run': class {
      async run () {
        return {
          processedEnvs: [],
          readableStrings: [],
          readableFilepaths: [],
          uniqueInjectedKeys: []
        }
      }
    },
    '../../../src/lib/helpers/executeCommand': async () => true,
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', 'ok'])

  await run.call({ opts: () => ({}), args: ['echo', 'ok'], envs: [] })

  t.ok(spinner.stop.calledOnce, 'spinner.stop called on success branch')
  ct.end()
})

t.test('run stops spinner on catch path', async ct => {
  const spinner = { stop: sinon.stub() }
  const boom = new Error('boom')
  const catchAndLogStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')

  const run = proxyquire('../../../src/cli/actions/run', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    '../../../src/lib/services/run': class {
      async run () {
        throw boom
      }
    },
    '../../../src/lib/helpers/catchAndLog': catchAndLogStub,
    '../../../src/lib/helpers/executeCommand': async () => true,
    '../../../src/db/session': class {
      async opsOn () {
        return false
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', 'ok'])

  await run.call({ opts: () => ({}), args: ['echo', 'ok'], envs: [] })

  t.ok(spinner.stop.calledOnce, 'spinner.stop called in catch branch')
  t.ok(catchAndLogStub.calledWith(boom), 'error logged through catchAndLog')
  t.ok(processExitStub.calledWith(1), 'process.exit(1) called')
  ct.end()
})
