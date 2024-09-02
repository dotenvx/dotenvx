const t = require('tap')
const sinon = require('sinon')

const main = require('../../../src/lib/main')
const ls = require('../../../src/cli/actions/ls')

t.test('ls calls main.ls', ct => {
  const stub = sinon.stub(main, 'ls')
  stub.returns({})

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the ls function with the fake context
  ls.call(fakeContext, '.')

  t.ok(stub.called, 'main.ls() called')
  stub.restore()

  ct.end()
})
