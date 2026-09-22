const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const path = require('path')

t.beforeEach(() => {
  sinon.restore()
})

t.test('ls traverses with a spinner and stops it before output', async ct => {
  const spinner = { text: 'traversing', stop: sinon.stub() }
  const createSpinner = sinon.stub().resolves(spinner)
  const main = {
    ls: sinon.stub().callsFake((directory, envFile, excludeEnvFile, onDirectory) => {
      onDirectory('packages')
      onDirectory('packages/example')
      return ['.env', 'packages/example/.env']
    })
  }
  const stderrStub = sinon.stub(console, 'error')
  const logger = {
    debug: sinon.stub(),
    info: sinon.stub()
  }
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': main,
    './../../shared/logger': { logger },
    '../../lib/helpers/createSpinner': createSpinner
  })

  await ls.call({
    opts: () => ({ envFile: '.env*' }),
    optsWithGlobals: () => ({ quiet: false })
  }, '.')

  ct.same(createSpinner.firstCall.args, [{ quiet: false, envFile: '.env*', text: 'traversing' }])
  ct.equal(main.ls.firstCall.args[0], '.')
  ct.equal(main.ls.firstCall.args[1], '.env*')
  ct.equal(main.ls.firstCall.args[2], undefined)
  ct.match(spinner.text, /^traversing 3 directories \(\d+s\) — packages\/example$/)
  ct.match(stderrStub.firstCall.args[0], /^▣ found 2 \.env files across 2 directories of 3 scanned in \d+s$/)
  ct.equal(spinner.stop.callCount, 1)
  ct.ok(spinner.stop.calledBefore(logger.info), 'stops spinner before tree output')
  ct.notOk(logger.info.calledWithMatch(/^▣ found/), 'does not print summary to stdout')
  ct.end()
})

t.test('ls does not print a summary in quiet mode', async ct => {
  const stderrStub = sinon.stub(console, 'error')
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': { ls: sinon.stub().returns(['.env']) },
    '../../lib/helpers/createSpinner': sinon.stub().resolves(null)
  })

  await ls.call({
    opts: () => ({}),
    optsWithGlobals: () => ({ quiet: true })
  }, '.')

  ct.equal(stderrStub.callCount, 0)
  ct.end()
})

t.test('ls prints absolute filepaths as json', async ct => {
  const stdoutStub = sinon.stub(console, 'log')
  const stderrStub = sinon.stub(console, 'error')
  const logger = {
    debug: sinon.stub(),
    info: sinon.stub()
  }
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': { ls: sinon.stub().returns(['.env', 'packages/example/.env']) },
    './../../shared/logger': { logger },
    '../../lib/helpers/createSpinner': sinon.stub().resolves(null)
  })
  const directory = path.resolve('project')

  await ls.call({
    opts: () => ({ json: true }),
    optsWithGlobals: () => ({ quiet: false })
  }, directory)

  ct.same(JSON.parse(stdoutStub.firstCall.args[0]), [
    path.join(directory, '.env'),
    path.join(directory, 'packages/example/.env')
  ])
  ct.equal(logger.info.callCount, 0, 'does not print the tree')
  ct.match(stderrStub.firstCall.args[0], /^▣ found 2 \.env files/)
  ct.end()
})

t.test('ls stops the spinner and reports traversal errors', async ct => {
  const error = new Error('cannot traverse')
  const spinner = { stop: sinon.stub() }
  const createSpinner = sinon.stub().resolves(spinner)
  const catchAndLog = sinon.stub()
  const exitStub = sinon.stub(process, 'exit')
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': { ls: sinon.stub().throws(error) },
    '../../lib/helpers/createSpinner': createSpinner,
    '../../lib/helpers/catchAndLog': catchAndLog
  })

  const result = await ls.call({ opts: () => ({}) }, '.')

  ct.equal(spinner.stop.callCount, 1)
  ct.same(catchAndLog.firstCall.args, [error])
  ct.equal(result.exitCode, 1, 'returns the exit code to the command lifecycle')
  ct.ok(exitStub.notCalled, 'leaves process termination to the command lifecycle')
  ct.end()
})
