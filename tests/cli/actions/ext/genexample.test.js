const t = require('tap')
const fsx = require('../../../../src/lib/helpers/fsx')
const sinon = require('sinon')

const main = require('../../../../src/lib/main')
const genexample = require('../../../../src/cli/actions/ext/genexample')

t.test('genexample calls main.genexample', ct => {
  const stub = sinon.stub(main, 'genexample')
  stub.returns({
    envExampleFile: 'HELLO=""',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: ['HELLO']
  })

  const fsStub = sinon.stub(fsx, 'writeFileX')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  t.ok(stub.called, 'main.genexample() called')
  t.ok(fsStub.called, 'fs.writeFileX() called')
  stub.restore()
  fsStub.restore()

  ct.end()
})

t.test('genexample calls main.genexample (no addedKeys changes)', ct => {
  const stub = sinon.stub(main, 'genexample')
  stub.returns({
    envExampleFile: '',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: []
  })

  const fsStub = sinon.stub(fsx, 'writeFileX')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  t.ok(stub.called, 'main.genexample() called')
  t.ok(fsStub.called, 'fsx.writeFileX() called')
  stub.restore()
  fsStub.restore()

  ct.end()
})

t.test('genexample calls main.genexample (other error)', ct => {
  const stub = sinon.stub(main, 'genexample').throws(new Error('other error'))
  const exitStub = sinon.stub(process, 'exit')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  stub.restore()
  exitStub.restore()

  ct.end()
})

t.test('genexample calls main.genexample (error with code and help message)', ct => {
  const error = new Error('message')
  error.help = 'help message'
  error.code = 'CODE'

  const stub = sinon.stub(main, 'genexample').throws(error)
  const exitStub = sinon.stub(process, 'exit')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  ct.ok(exitStub.calledWith(1), 'process.exit was called with code 1')

  stub.restore()
  exitStub.restore()

  ct.end()
})
