const t = require('tap')
const sinon = require('sinon')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

let radarPath

t.beforeEach((ct) => {
  sinon.restore()
  // Clear the module cache
  delete require.cache[require.resolve('../../../src/lib/helpers/logRadar')]
  
  // Clean up any existing fake module
  radarPath = path.join(__dirname, '../../../node_modules', '@dotenvx', 'dotenvx-radar')
  if (fs.existsSync(radarPath)) {
    fs.rmSync(radarPath, { recursive: true, force: true })
  }
})

t.afterEach((ct) => {
  // Clean up fake module after each test
  if (radarPath && fs.existsSync(radarPath)) {
    fs.rmSync(radarPath, { recursive: true, force: true })
  }
})

t.test('logRadar - radar module found via require.resolve', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  
  // Create a fake @dotenvx/dotenvx-radar module in node_modules
  const radarDir = path.join(__dirname, '../../../node_modules', '@dotenvx')
  radarPath = path.join(radarDir, 'dotenvx-radar')
  
  // Create the directory structure
  fs.mkdirSync(radarPath, { recursive: true })
  
  // Create a simple fake package
  const fakePackage = {
    name: '@dotenvx/dotenvx-radar',
    version: '1.0.0',
    main: 'index.js'
  }
  
  fs.writeFileSync(path.join(radarPath, 'package.json'), JSON.stringify(fakePackage, null, 2))
  fs.writeFileSync(path.join(radarPath, 'index.js'), 'module.exports = {};')
  
  const logRadar = require('../../../src/lib/helpers/logRadar')
  logRadar()

  ct.ok(loggerSuccessvStub.calledWith('radar active 📡'), 'logger.successv called when radar module found')
  
  ct.end()
})

t.test('logRadar - radar CLI found via execSync', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  
  // Mock execSync to succeed
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.returns(Buffer.from('help output'))
  
  const logRadar = require('../../../src/lib/helpers/logRadar')
  logRadar()

  ct.ok(loggerSuccessvStub.calledWith('radar active 📡'), 'logger.successv called when radar CLI found')
  ct.ok(execSyncStub.calledWith('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] }), 'execSync called with correct arguments')
  
  ct.end()
})

t.test('logRadar - neither module nor CLI found', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  
  // Mock execSync to throw an error
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.throws(new Error('Command not found'))
  
  const logRadar = require('../../../src/lib/helpers/logRadar')
  logRadar()

  ct.ok(loggerSuccessvStub.notCalled, 'logger.successv not called when neither module nor CLI found')
  ct.ok(execSyncStub.calledWith('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] }), 'execSync called with correct arguments')
  
  ct.end()
})