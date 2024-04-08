const t = require('tap')
const sinon = require('sinon')
const execa = require('execa')

const isGitRepo = require('../../../src/lib/helpers/isGitRepo')

t.test('#isGitRepo', ct => {
  const result = isGitRepo()

  ct.same(result, true)

  ct.end()
})

t.test('should return false when not in a git repository', ct => {
  const execaStub = sinon.stub(execa, 'sync')
  // Configure the stub to throw an error, simulating a failed git command
  execaStub.throws(new Error('Not a git repository'))

  ct.same(isGitRepo(), false)

  ct.end()
})
