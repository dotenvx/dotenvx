const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const childProcess = require('child_process')

const helpers = require('./../../src/cli/helpers')

t.test('#resolvePath', ct => {
  const result = helpers.resolvePath('file')

  ct.same(result, path.resolve(process.cwd(), 'file'))

  ct.end()
})

t.test('#pluralize', ct => {
  const result = helpers.pluralize('file', 1)
  ct.same(result, 'file')

  const result2 = helpers.pluralize('file', 2)
  ct.same(result2, 'files')

  ct.end()
})

t.test('#getRemoteOriginUrl', ct => {
  const execSyncStub = sinon.stub(childProcess, 'execSync').returns('git@github.com:dotenvx/dotenvx.git')
  const result = helpers.getRemoteOriginUrl()

  t.equal(result, 'git@github.com:dotenvx/dotenvx.git', 'Should return git url')
  t.ok(execSyncStub.calledOnce, 'execSync should be called once')

  execSyncStub.restore()

  ct.end()
})

t.test('#getRemoteOriginUrl (error)', ct => {
  const execSyncStub = sinon.stub(childProcess, 'execSync').throws(new Error('fake error'))
  const result = helpers.getRemoteOriginUrl()

  t.equal(result, null, 'Should return null on error')
  t.ok(execSyncStub.calledOnce, 'execSync should be called once')

  execSyncStub.restore()

  ct.end()
})

t.test('#extractUsernameName', ct => {
  const result = helpers.extractUsernameName('https://github.com/motdotla/dotenv')

  ct.same(result, 'motdotla/dotenv')

  ct.end()
})
