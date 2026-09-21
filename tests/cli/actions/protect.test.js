const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

function setup (ct) {
  for (const stream of [process.stdin, process.stderr]) {
    const descriptor = Object.getOwnPropertyDescriptor(stream, 'isTTY')
    Object.defineProperty(stream, 'isTTY', { configurable: true, value: true })
    ct.teardown(() => {
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else delete stream.isTTY
    })
  }
  const ci = process.env.CI
  const exitCode = process.exitCode
  delete process.env.CI
  ct.teardown(() => {
    if (ci === undefined) delete process.env.CI
    else process.env.CI = ci
    process.exitCode = exitCode
  })
  const multiselect = sinon.stub()
  const filter = sinon.stub()
  const ignore = sinon.stub()
  const uninstall = sinon.stub().returns({})
  const stdin = sinon.stub()
  const processFilter = sinon.stub()
  const removeLegacy = sinon.stub()
  const spinner = { stop: sinon.stub() }
  const createSpinner = sinon.stub().resolves(spinner)
  const logger = { success: sinon.stub(), warn: sinon.stub(), info: sinon.stub() }
  const settings = {
    state: sinon.stub().returns({ filter: false, ignore: false, configured: false }),
    removeFilter: sinon.stub(),
    removeIgnore: sinon.stub(),
    markConfigured: sinon.stub()
  }
  const protect = proxyquire('../../../src/cli/actions/protect', {
    '../../lib/helpers/prompts': { multiselect },
    '../../lib/helpers/installProtectFilter': filter,
    '../../lib/helpers/installProtectIgnore': ignore,
    '../../lib/helpers/uninstallPrecommitHook': uninstall,
    '../../lib/helpers/removeLegacyProtectFilter': removeLegacy,
    './protectStdin': stdin,
    './protectProcess': processFilter,
    '../../shared/logger': { logger },
    '../../lib/helpers/protectSettings': settings,
    '../../lib/helpers/createSpinner': createSpinner,
    '../../lib/helpers/catchAndLog': sinon.stub()
  })
  return { protect: (options = {}) => protect.call({ opts: () => options }), multiselect, filter, ignore, uninstall, stdin, logger, settings, removeLegacy, processFilter, spinner, createSpinner }
}

for (const choices of [[true, true], [true, false], [false, true], [false, false]]) {
  t.test(`protect choices ${choices}`, async ct => {
    const s = setup(ct)
    s.multiselect.resolves(['filter', 'ignore'].filter((value, index) => choices[index]))
    await s.protect()
    ct.equal(s.multiselect.callCount, 1)
    ct.same({ ...s.multiselect.firstCall.args[0], submitLabel: undefined }, {
      message: 'Set protections',
      submitLabel: undefined,
      choices: [
        { name: 'Protect plaintext secrets from code commits (.env*)', value: 'filter' },
        { name: 'Protect private keys from code commits (.env.keys*)', value: 'ignore' }
      ],
      initial: ['filter', 'ignore']
    })
    ct.equal(s.filter.callCount, Number(choices[0]))
    ct.equal(s.ignore.callCount, Number(choices[1]))
    ct.equal(s.uninstall.callCount, Number(choices[0]))
    const labels = ['plaintext *.env', '.env.keys*'].filter((value, index) => choices[index])
    ct.same(s.logger.success.args, [[labels.length ? `⛉ protected (${labels.join(', ')})` : '⛉ unprotected (none)']])
    ct.equal(s.settings.removeFilter.callCount, 0)
    ct.equal(s.settings.removeIgnore.callCount, 0)
    ct.equal(s.settings.markConfigured.callCount, 1)
    ct.equal(s.multiselect.firstCall.args[0].submitLabel(['filter']), 'Install protections')
    ct.equal(s.createSpinner.firstCall.args[0].text, labels.length ? 'protecting' : 'unprotecting')
    ct.ok(s.createSpinner.calledAfter(s.multiselect))
    ct.ok(s.spinner.stop.calledBefore(s.logger.success))
  })
}

t.test('cancelling the checklist leaves configuration unchanged', async ct => {
  const s = setup(ct)
  s.multiselect.rejects(new Error('prompt cancelled'))
  await s.protect()
  ct.equal(process.exitCode, 1)
  ct.equal(s.filter.callCount, 0)
  ct.equal(s.ignore.callCount, 0)
  ct.equal(s.uninstall.callCount, 0)
  ct.equal(s.logger.success.callCount, 0)
  ct.equal(s.createSpinner.callCount, 0)
  ct.equal(s.settings.removeFilter.callCount, 0)
  ct.equal(s.settings.removeIgnore.callCount, 0)
})

t.test('installation failure does not report success', async ct => {
  const s = setup(ct)
  s.multiselect.resolves(['filter', 'ignore'])
  s.ignore.throws(new Error('installation failed'))
  await s.protect()
  ct.equal(process.exitCode, 1)
  ct.equal(s.logger.success.callCount, 0)
  ct.equal(s.spinner.stop.callCount, 1)
})

t.test('CI preserves filter-only installation without prompts', async ct => {
  const s = setup(ct)
  process.env.CI = 'true'
  await s.protect()
  ct.equal(s.multiselect.callCount, 0)
  ct.equal(s.filter.callCount, 1)
  ct.equal(s.ignore.callCount, 0)
  ct.equal(s.settings.removeIgnore.callCount, 0)
  ct.equal(s.settings.removeFilter.callCount, 0)
})

t.test('both choices default on while existing settings control action labels', async ct => {
  const s = setup(ct)
  s.settings.state.returns({ configured: true, filter: true, ignore: false })
  s.multiselect.resolves(['filter'])
  await s.protect()
  const options = s.multiselect.firstCall.args[0]
  ct.same(options.initial, ['filter', 'ignore'])
  ct.equal(options.submitLabel(['filter']), 'Done')
  ct.equal(options.submitLabel(['filter', 'ignore']), 'Apply changes')
  ct.equal(options.submitLabel([]), 'Remove protections')
  ct.equal(s.filter.callCount, 1, 'refreshes an already enabled global filter')
  ct.ok(s.removeLegacy.calledAfter(s.filter), 'migrates local filter only after global installation')
})

t.test('previously removed protections still default to selected', async ct => {
  const s = setup(ct)
  s.settings.state.returns({ configured: true, filter: false, ignore: false })
  s.multiselect.resolves([])
  await s.protect()
  ct.same(s.multiselect.firstCall.args[0].initial, ['filter', 'ignore'])
  ct.equal(s.multiselect.firstCall.args[0].submitLabel([]), 'Done')
})

t.test('unchecking installed protections removes them', async ct => {
  const s = setup(ct)
  s.settings.state.returns({ configured: true, filter: true, ignore: true })
  s.multiselect.resolves([])
  await s.protect()
  ct.equal(s.settings.removeFilter.callCount, 1)
  ct.equal(s.settings.removeIgnore.callCount, 1)
  ct.equal(s.filter.callCount, 0)
  ct.equal(s.ignore.callCount, 0)
  ct.same(s.logger.success.args, [['⛉ unprotected (none)']])
})

t.test('Git filter invocation never prompts or installs', async ct => {
  const s = setup(ct)
  await s.protect({ gitFile: '.env' })
  ct.ok(s.stdin.calledWith('.env'))
  ct.equal(s.multiselect.callCount, 0)
  ct.equal(s.filter.callCount, 0)
  ct.equal(s.ignore.callCount, 0)
  ct.equal(s.uninstall.callCount, 0)
})

t.test('Git process invocation never prompts or installs', async ct => {
  const s = setup(ct)
  await s.protect({ gitProcess: true })
  ct.equal(s.processFilter.callCount, 1)
  ct.equal(s.multiselect.callCount, 0)
  ct.equal(s.filter.callCount, 0)
  ct.equal(s.ignore.callCount, 0)
  ct.equal(s.settings.state.callCount, 0)
  ct.equal(s.createSpinner.callCount, 0)
})
