const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

function makeNoopLogger () {
  return {
    debug: () => {},
    verbose: () => {},
    success: () => {},
    error: () => {}
  }
}

t.test('keypair stops spinner before output', async ct => {
  const sandbox = sinon.createSandbox()
  ct.teardown(() => sandbox.restore())
  const spinner = { stop: sandbox.stub() }
  const consoleLogStub = sandbox.stub(console, 'log')

  const keypair = proxyquire('../../../src/cli/actions/keypair', {
    '../../lib/helpers/createSpinner': async () => spinner,
    './../../lib/resolvers/keypair': async () => ({ DOTENV_PUBLIC_KEY: '<publicKey>' }),
    // Exercise the action without event delivery or the CLI's process.exit.
    '../../lib/events/cli': (_command, action) => action,
    './../../shared/logger': { logger: makeNoopLogger() }
  })

  await keypair.call({ opts: () => ({}), envs: [] }, 'DOTENV_PUBLIC_KEY')

  ct.equal(spinner.stop.callCount, 1, 'spinner.stop called once')
  ct.ok(consoleLogStub.calledOnceWithExactly('<publicKey>'), 'prints selected keypair value')
  ct.ok(spinner.stop.calledBefore(consoleLogStub), 'spinner stops before output')
})
