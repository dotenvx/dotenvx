const t = require('tap')
const fs = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')

const isIgnoringDotenvKeys = require('../../../src/lib/helpers/isIgnoringDotenvKeys')

t.test('#isIgnoringDotenvKeys - no .gitignore file', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync')
  existsSyncStub.returns(false)

  const result = isIgnoringDotenvKeys()
  ct.same(result, false)

  existsSyncStub.restore()

  ct.end()
})

t.test('#isIgnoringDotenvKeys - empty .gitignore file', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync')
  existsSyncStub.returns(true)
  const readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.returns('')

  const result = isIgnoringDotenvKeys()

  ct.same(result, false)

  existsSyncStub.restore()
  readFileSyncStub.restore()

  ct.end()
})

t.test('#isIgnoringDotenvKeys - .gitignore file ignores .env*', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync')
  existsSyncStub.returns(true)
  const readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.returns('.env*')

  const result = isIgnoringDotenvKeys()

  ct.same(result, true)

  existsSyncStub.restore()
  readFileSyncStub.restore()

  ct.end()
})
