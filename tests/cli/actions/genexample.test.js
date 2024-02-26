const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../../src/lib/main')
const genexample = require('../../../src/cli/actions/genexample')

t.test('genexample calls main.genexample', async ct => {
  const stub = sinon.stub(main, 'genexample')
  stub.returns({
    envExampleFile: 'HELLO=""',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: ['HELLO']
  })

  const fsStub = sinon.stub(fs, 'writeFileSync')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the ls function with the fake context
  await genexample.call(fakeContext, '.')

  t.ok(stub.called, 'main.genexample() called')
  t.ok(fsStub.called, 'fs.writeFileSync() called')
  stub.restore()
  fsStub.restore()

  ct.end()
})

t.test('genexample calls main.genexample (no addedKeys changes)', async ct => {
  const stub = sinon.stub(main, 'genexample')
  stub.returns({
    envExampleFile: '',
    envFile: '.env.example',
    exampleFilepath: '.env.example',
    addedKeys: []
  })

  const fsStub = sinon.stub(fs, 'writeFileSync')

  const optsStub = sinon.stub().returns({})
  const fakeContext = {
    opts: optsStub
  }

  // Call the ls function with the fake context
  await genexample.call(fakeContext, '.')

  t.ok(stub.called, 'main.genexample() called')
  t.ok(fsStub.called, 'fs.writeFileSync() called')
  stub.restore()
  fsStub.restore()

  ct.end()
})
