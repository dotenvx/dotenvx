const t = require('tap')
const sinon = require('sinon')
const execa = require('execa')
const path = require('path')

const gitRoot = require('../../../src/lib/helpers/gitRoot')

t.test('#gitRoot', ct => {
  const expectedPath = path.resolve(__dirname, '../../../src/lib/helpers/gitRoot').replace(/\\/g, '/')
  const execaStub = sinon.stub(execa, 'sync').returns({ stdout: expectedPath })

  const result = gitRoot()

  ct.same(result, expectedPath)

  execaStub.restore()

  ct.end()
})

t.test('should return null when not in a git repository', ct => {
  const execaStub = sinon.stub(execa, 'sync')
  execaStub.throws(new Error('Not a git repository'))

  const result = gitRoot()

  ct.same(result, null)

  execaStub.restore()

  ct.end()
})
