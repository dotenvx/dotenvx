const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')

const isIgnoringDotenvKeys = require('../../../src/lib/helpers/isIgnoringDotenvKeys')

t.test('#isIgnoringDotenvKeys - no .gitignore file', ct => {
  const existsSyncStub = sinon.stub(fsx, 'existsSync')
  existsSyncStub.returns(false)

  const result = isIgnoringDotenvKeys()
  ct.same(result, false)

  existsSyncStub.restore()

  ct.end()
})

t.test('#isIgnoringDotenvKeys - empty .gitignore file', ct => {
  const existsSyncStub = sinon.stub(fsx, 'existsSync')
  existsSyncStub.returns(true)
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  readFileXStub.returns('')

  const result = isIgnoringDotenvKeys()

  ct.same(result, false)

  existsSyncStub.restore()
  readFileXStub.restore()

  ct.end()
})

t.test('#isIgnoringDotenvKeys - .gitignore file ignores .env*', ct => {
  const existsSyncStub = sinon.stub(fsx, 'existsSync')
  existsSyncStub.returns(true)
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  readFileXStub.returns('.env*')

  const result = isIgnoringDotenvKeys()

  ct.same(result, true)

  existsSyncStub.restore()
  readFileXStub.restore()

  ct.end()
})
