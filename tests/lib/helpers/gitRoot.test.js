const t = require('tap')
const sinon = require('sinon')
const execa = require('execa')

const gitRoot = require('../../../src/lib/helpers/gitRoot')

t.test('#gitRoot', ct => {
  const result = gitRoot()

  ct.same(result, '/Users/scottmotte/Code/dotenvx/dotenvx')

  ct.end()
})

t.test('should return null when not in a git repository', ct => {
  const execaStub = sinon.stub(execa, 'sync')
  // Configure the stub to throw an error, simulating a failed git command
  execaStub.throws(new Error('Not a git repository'))

  ct.same(gitRoot(), null)

  ct.end()
})
