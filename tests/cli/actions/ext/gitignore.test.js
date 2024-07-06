const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const gitignore = require('../../../../src/cli/actions/ext/gitignore')

const Git = require('../../../../src/cli/actions/ext/gitignore').Git
const Docker = require('../../../../src/cli/actions/ext/gitignore').Docker
const Npm = require('../../../../src/cli/actions/ext/gitignore').Npm
const Vercel = require('../../../../src/cli/actions/ext/gitignore').Vercel
const Generic = require('../../../../src/cli/actions/ext/gitignore').Generic

const { logger } = require('../../../../src/shared/logger')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('gitignore calls Git, Docker, Npm, and Vercel', ct => {
  // Stub the run methods of Git, Docker, Npm, and Vercel classes
  const gitStub = sinon.stub(Git.prototype, 'run')
  const dockerStub = sinon.stub(Docker.prototype, 'run')
  const npmStub = sinon.stub(Npm.prototype, 'run')
  const vercelStub = sinon.stub(Vercel.prototype, 'run')

  gitignore.call(fakeContext)

  t.ok(gitStub.called, 'Git().run() called')
  t.ok(dockerStub.called, 'Docker().run() called')
  t.ok(npmStub.called, 'Npm().run() called')
  t.ok(vercelStub.called, 'Vercel().run() called')

  sinon.restore()

  ct.end()
})

t.test('Git calls Generic', ct => {
  const genericStub = sinon.stub(Generic.prototype, 'run')

  new Git().run()

  t.ok(genericStub.called, 'Generic().run() called')

  ct.end()
})

t.test('Docker calls Generic', ct => {
  const genericStub = sinon.stub(Generic.prototype, 'run')

  new Docker().run()

  t.ok(genericStub.called, 'Generic().run() called')

  ct.end()
})

t.test('Npm calls Generic', ct => {
  const genericStub = sinon.stub(Generic.prototype, 'run')

  new Npm().run()

  t.ok(genericStub.called, 'Generic().run() called')

  ct.end()
})

t.test('Vercel calls Generic', ct => {
  const genericStub = sinon.stub(Generic.prototype, 'run')

  new Vercel().run()

  t.ok(genericStub.called, 'Generic().run() called')

  ct.end()
})

t.test('Generic class - constructor initializes correctly', (ct) => {
  const generic = new Generic('.gitignore', true)
  ct.equal(generic.filename, '.gitignore', 'filename should be initialized correctly')
  ct.same(generic.formats, ['.env*', '!.env.vault'], 'formats should be initialized correctly')
  ct.equal(generic.touchFile, true, 'touchFile should be initialized correctly')
  ct.end()
})

t.test('Generic class - append method', (ct) => {
  const appendFileSyncStub = sinon.stub(fs, 'appendFileSync')

  const generic = new Generic('.gitignore', true)
  generic.append('TEST')

  ct.ok(appendFileSyncStub.calledWith('.gitignore', '\nTEST'), 'appendFileSync should be called with correct arguments')

  ct.end()
})

t.test('Generic class - run method - creates file if it does not exist and touchFile is true', (ct) => {
  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false)
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  const loggerInfoStub = sinon.stub(logger, 'info')

  const generic = new Generic('.gitignore', true)
  generic.run()

  ct.ok(existsSyncStub.calledWith('.gitignore'), 'existsSync should be called with correct filename')
  ct.ok(loggerInfoStub.calledWith('creating .gitignore'), 'logger.info should log the creation message')
  ct.ok(writeFileSyncStub.calledWith('.gitignore', ''), 'writeFileSync should be called to create the file')

  ct.end()
})

t.test('Generic class - run method - does nothing if file does not exist and touchFile is false', (ct) => {
  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false)
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')

  const generic = new Generic('.gitignore', false)
  generic.run()

  ct.ok(existsSyncStub.calledWith('.gitignore'), 'existsSync should be called with correct filename')
  ct.notOk(writeFileSyncStub.called, 'writeFileSync should not be called')

  ct.end()
})

t.test('Generic class - run method - appends formats to existing file', (ct) => {
  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('some content\n')
  const appendStub = sinon.stub(Generic.prototype, 'append')
  const loggerInfoStub = sinon.stub(logger, 'info')

  const generic = new Generic('.gitignore', false)
  generic.run()

  ct.ok(existsSyncStub.calledWith('.gitignore'), 'existsSync should be called with correct filename')
  ct.ok(readFileSyncStub.calledWith('.gitignore', 'utf8'), 'readFileSync should be called with correct arguments')

  const formats = ['.env*', '!.env.vault']
  formats.forEach(format => {
    ct.ok(appendStub.calledWith(format), `append should be called with ${format}`)
    ct.ok(loggerInfoStub.calledWith(`appending ${format} to .gitignore`), `logger.info should log appending ${format}`)
  })

  ct.end()
})
