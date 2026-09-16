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

t.beforeEach(() => {
  sinon.restore()
  process.env = {}
})

t.test('keypair stops spinner before output', async ct => {
  const spinner = { stop: sinon.stub() }
  const consoleLogStub = sinon.stub(console, 'log')

  const keypair = proxyquire('../../../src/cli/actions/keypair', {
    '../../../src/lib/helpers/createSpinner': async () => spinner,
    './../../lib/resolvers/keypair': async () => ({ DOTENV_PUBLIC_KEY: '<publicKey>' }),
    '../../../src/db/session': class {
      async noArmor () {
        return true
      }
    },
    '../../../src/shared/logger': { logger: makeNoopLogger() }
  })

  await keypair.call({ opts: () => ({}), envs: [] }, 'DOTENV_PUBLIC_KEY')

  t.equal(spinner.stop.callCount, 1, 'spinner.stop called before output')
  t.ok(consoleLogStub.calledWith('<publicKey>'), 'prints selected keypair value')
  ct.end()
})
