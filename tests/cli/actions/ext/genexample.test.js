const t = require('tap')
const fsx = require('../../../../src/lib/helpers/fsx')
const sinon = require('sinon')

const Genexample = require('../../../../src/lib/services/genexample')
const genexample = require('../../../../src/cli/actions/ext/genexample')
const { logger } = require('../../../../src/shared/logger')

t.test('genexample calls Genexample.run', ct => {
  const stub = sinon.stub(Genexample.prototype, 'run')
  stub.returns({
    envExampleFile: 'HELLO=""',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: ['HELLO']
  })

  const fsStub = sinon.stub(fsx, 'writeFileXSync')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  t.ok(stub.called, 'Genexample.run() called')
  t.ok(fsStub.called, 'fs.writeFileXSync() called')
  t.ok(loggerSuccessStub.calledWith('▣ generated (.env.example)'), 'logger.success')
  stub.restore()
  fsStub.restore()
  loggerSuccessStub.restore()

  ct.end()
})

t.test('genexample calls Genexample.run (no addedKeys changes)', ct => {
  const stub = sinon.stub(Genexample.prototype, 'run')
  stub.returns({
    envExampleFile: '',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: []
  })

  const fsStub = sinon.stub(fsx, 'writeFileXSync')
  const loggerNeutralStub = sinon.stub(logger, 'info')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the genexample function with the fake context
  genexample.call(fakeContext, '.')

  t.ok(stub.called, 'Genexample.run() called')
  t.ok(fsStub.called, 'fsx.writeFileXSync() called')
  t.ok(loggerNeutralStub.calledWith('○ no change (.env.example)'), 'logger.info')
  stub.restore()
  fsStub.restore()
  loggerNeutralStub.restore()

  ct.end()
})

t.test('genexample calls Genexample.run (other error)', ct => {
  const stub = sinon.stub(Genexample.prototype, 'run').throws(new Error('other error'))
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

t.test('genexample calls Genexample.run (error with code and help message)', ct => {
  const error = new Error('message')
  error.help = 'help message'
  error.code = 'CODE'

  const stub = sinon.stub(Genexample.prototype, 'run').throws(error)
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
