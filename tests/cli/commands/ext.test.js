const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

t.test('ext dynamic action forwards to executeExtension', (ct) => {
  const executeExtensionStub = sinon.stub()

  const ext = proxyquire('../../../src/cli/commands/ext', {
    './../../lib/helpers/executeExtension': executeExtensionStub,
    '../../lib/helpers/removeDynamicHelpSection': () => {},
    './../examples': {
      gitignore: () => '',
      prebuild: () => '',
      precommit: () => ''
    },
    './../actions/ls': sinon.stub(),
    './../actions/ext/genexample': sinon.stub(),
    './../actions/ext/gitignore': sinon.stub(),
    './../actions/ext/prebuild': sinon.stub(),
    './../actions/ext/precommit': sinon.stub(),
    './../actions/ext/scan': sinon.stub()
  })

  ext._actionHandler('scan', ['--json'])

  ct.ok(executeExtensionStub.calledOnce, 'executeExtension called')
  ct.ok(executeExtensionStub.calledWith(ext, 'scan', ['--json']), 'executeExtension called with expected args')
  ct.end()
})

t.test('ext subcommands lazy-load handlers and preserve this context', (ct) => {
  const lsStub = sinon.stub()
  const genexampleStub = sinon.stub()
  const gitignoreStub = sinon.stub()
  const prebuildStub = sinon.stub()
  const precommitStub = sinon.stub()
  const scanStub = sinon.stub()

  const ext = proxyquire('../../../src/cli/commands/ext', {
    './../../lib/helpers/executeExtension': sinon.stub(),
    '../../lib/helpers/removeDynamicHelpSection': () => {},
    './../examples': {
      gitignore: () => '',
      prebuild: () => '',
      precommit: () => ''
    },
    './../actions/ls': lsStub,
    './../actions/ext/genexample': genexampleStub,
    './../actions/ext/gitignore': gitignoreStub,
    './../actions/ext/prebuild': prebuildStub,
    './../actions/ext/precommit': precommitStub,
    './../actions/ext/scan': scanStub
  })

  const commandToStub = {
    ls: lsStub,
    genexample: genexampleStub,
    gitignore: gitignoreStub,
    prebuild: prebuildStub,
    precommit: precommitStub,
    scan: scanStub
  }

  for (const [name, stub] of Object.entries(commandToStub)) {
    ct.equal(stub.callCount, 0, `${name} handler not called before action executes`)

    const subcommand = ext.commands.find((c) => c.name() === name)
    subcommand._actionHandler('arg1', 'arg2')

    ct.equal(stub.callCount, 1, `${name} handler called once`)
    ct.ok(stub.calledOn(subcommand), `${name} handler called with commander context`)
    ct.same(stub.firstCall.args, ['arg1', 'arg2'], `${name} handler receives forwarded args`)
  }

  ct.end()
})

t.test('ext helpInformation removes dynamic section', (ct) => {
  const removeDynamicHelpSectionStub = sinon.stub()

  const ext = proxyquire('../../../src/cli/commands/ext', {
    './../../lib/helpers/executeExtension': sinon.stub(),
    '../../lib/helpers/removeDynamicHelpSection': removeDynamicHelpSectionStub,
    './../examples': {
      gitignore: () => '',
      prebuild: () => '',
      precommit: () => ''
    },
    './../actions/ls': sinon.stub(),
    './../actions/ext/genexample': sinon.stub(),
    './../actions/ext/gitignore': sinon.stub(),
    './../actions/ext/prebuild': sinon.stub(),
    './../actions/ext/precommit': sinon.stub(),
    './../actions/ext/scan': sinon.stub()
  })

  const help = ext.helpInformation()

  ct.ok(removeDynamicHelpSectionStub.calledOnce, 'removeDynamicHelpSection called')
  ct.type(help, 'string', 'helpInformation returns a string')
  ct.end()
})
