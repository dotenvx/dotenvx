const t = require('tap')
const sinon = require('sinon')

const main = require('../../../../src/lib/main')
const ls = require('../../../../src/cli/actions/ext/ls')

t.test('ls calls main.ls', async ct => {
  const stub = sinon.stub(main, 'ls')
  stub.returns({})

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the ls function with the fake context
  await ls.call(fakeContext, '.')

  t.ok(stub.called, 'main.ls() called')
  stub.restore()

  ct.end()
})
