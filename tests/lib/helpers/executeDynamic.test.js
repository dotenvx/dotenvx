const t = require('tap')
const sinon = require('sinon')
const fs = require('fs')
const os = require('os')
const path = require('path')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

const executeDynamic = require('../../../src/lib/helpers/executeDynamic')

const program = {
  outputHelp: sinon.stub()
}

function hasValidBoxShape (output) {
  const lines = output.split('\n')
  if (lines.length < 3) return false

  const top = lines[0]
  const bottom = lines[lines.length - 1]
  if (!/^ _+$/.test(top)) return false
  if (!/^\|_+\|$/.test(bottom)) return false

  const body = lines.slice(1, -1)
  return body.every((line) => line.startsWith('|') && line.endsWith('|'))
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('executeDynamic - no command', ct => {
  const processExitStub = sinon.stub(process, 'exit')

  executeDynamic(program, undefined, [])

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')

  ct.end()
})

t.test('executeDynamic - pro command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')

  executeDynamic(program, 'pro', ['pro'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')

  ct.end()
})

t.test('executeDynamic - ops command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  const originalCwd = process.cwd()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-execdynamic-'))
  process.env.npm_config_user_agent = ''
  process.chdir(tempDir)

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })

  ct.end()
})

t.test('executeDynamic - ops command missing with npm user agent', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  process.env.npm_config_user_agent = 'npm/10.9.0 node/v20.11.0 darwin arm64'

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm global install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent

  ct.end()
})

t.test('executeDynamic - ops command missing with pnpm user agent', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  process.env.npm_config_user_agent = 'pnpm/9.0.0 npm/? node/v20.11.0 darwin arm64'

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent

  ct.end()
})

t.test('executeDynamic - ops command missing with yarn user agent', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  process.env.npm_config_user_agent = 'yarn/1.22.22 npm/? node/v20.11.0 darwin arm64'

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent

  ct.end()
})

t.test('executeDynamic - ops command missing with pnpm lockfile', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  const originalCwd = process.cwd()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-execdynamic-pnpm-lock-'))
  fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"')
  process.env.npm_config_user_agent = ''
  process.chdir(tempDir)

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })

  ct.end()
})

t.test('executeDynamic - ops command missing with yarn lockfile', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  const originalCwd = process.cwd()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-execdynamic-yarn-lock-'))
  fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1')
  process.env.npm_config_user_agent = ''
  process.chdir(tempDir)

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })

  ct.end()
})

t.test('executeDynamic - ops command missing with package-lock lockfile', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  const originalCwd = process.cwd()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-execdynamic-npm-lock-'))
  fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{}')
  process.env.npm_config_user_agent = ''
  process.chdir(tempDir)

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })

  ct.end()
})

t.test('executeDynamic - ops command missing with package.json only', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')
  const originalUserAgent = process.env.npm_config_user_agent
  const originalCwd = process.cwd()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-execdynamic-packagejson-'))
  fs.writeFileSync(path.join(tempDir, 'package.json'), '{}')
  process.env.npm_config_user_agent = ''
  process.chdir(tempDir)

  executeDynamic(program, 'ops', ['ops'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')
  ct.match(consoleLogStub.firstCall.args[0], /Install now: \[npm i -g @dotenvx\/dotenvx-ops\]/, 'uses npm install command')
  ct.ok(hasValidBoxShape(consoleLogStub.firstCall.args[0]), 'banner box shape is valid')

  process.env.npm_config_user_agent = originalUserAgent
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })

  ct.end()
})

t.test('executeDynamic - other command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerInfoStub = sinon.stub(logger, 'info')

  executeDynamic(program, 'other', ['other'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')
  ct.ok(loggerInfoStub.calledWith('error: unknown command \'other\''), 'info')

  ct.end()
})

t.test('executeDynamic - pro found', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 0
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  executeDynamic(program, 'pro', ['pro'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')

  ct.end()
})
