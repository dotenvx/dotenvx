const t = require('tap')
const sinon = require('sinon')

const main = require('../../../src/lib/main')
const doctor = require('../../../src/cli/actions/doctor')
const { logger } = require('../../../src/shared/logger')

t.beforeEach(() => {
  sinon.restore()
})

t.test('doctor calls main.doctor and prints findings', ct => {
  const stub = sinon.stub(main, 'doctor').returns([
    { lang: 'Python', filepath: 'app.py', line: 2, code: 'load_dotenv()', msg: 'found python-dotenv load call' }
  ])
  const warnStub = sinon.stub(logger, 'warn')
  const infoStub = sinon.stub(logger, 'info')

  doctor('.')

  ct.ok(stub.calledWith('.'), 'main.doctor() called')
  ct.ok(warnStub.calledWith('found 1 possible dotenv loader'), 'logger.warn count')
  ct.ok(infoStub.calledWith('│ app.py:2: load_dotenv()'), 'logger.info finding')
  ct.end()
})

t.test('doctor pluralizes loader count', ct => {
  sinon.stub(main, 'doctor').returns([
    { lang: 'Python', filepath: 'app.py', line: 2, code: 'load_dotenv()', msg: 'found python-dotenv load call' },
    { lang: 'Node', filepath: 'index.js', line: 1, code: "require('dotenv').config()", msg: 'found dotenv config require call' }
  ])
  const warnStub = sinon.stub(logger, 'warn')
  sinon.stub(logger, 'info')

  doctor('.')

  ct.ok(warnStub.calledWith('found 2 possible dotenv loaders'), 'logger.warn count')
  ct.end()
})

t.test('doctor prints clean message when no findings are found', ct => {
  sinon.stub(main, 'doctor').returns([])
  const infoStub = sinon.stub(logger, 'info')

  doctor('.')

  ct.ok(infoStub.calledWith('no dotenv loaders found'), 'logger.info')
  ct.end()
})
