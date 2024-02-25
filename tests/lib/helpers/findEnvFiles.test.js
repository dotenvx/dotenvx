const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const findEnvFiles = require('../../../src/lib/helpers/findEnvFiles')

t.test('#findEnvFiles', ct => {
  const files = findEnvFiles('.')

  ct.same(files, [])

  ct.end()
})

t.test('#findEnvFiles (tests/monorepo/apps/frontend)', ct => {
  const files = findEnvFiles('tests/monorepo/apps/frontend')

  ct.same(files, ['.env'])

  ct.end()
})

t.test('#findEnvFiles (bad directory)', ct => {
  try {
    findEnvFiles('tests/does/not/exist')
    ct.fail('should have raised an error but did not')
  } catch (e) {
    ct.same(e.message, 'missing directory (tests/does/not/exist)')
    ct.same(e.code, 'MISSING_DIRECTORY')
  }

  ct.end()
})

t.test('#findEnvFiles (other error)', ct => {
  const mockError = new Error('Mock Error')
  mockError.code = 'other'

  const stub = sinon.stub(fs, 'readdirSync').throws(mockError)

  try {
    findEnvFiles('.')
    ct.fail('should have raised an error but did not')
  } catch (e) {
    ct.same(e.message, 'Mock Error')
  }

  stub.restore()

  ct.end()
})
