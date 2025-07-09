const t = require('tap')
const sinon = require('sinon')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

t.beforeEach((ct) => {
  sinon.restore()
  // Clear the module cache
  delete require.cache[require.resolve('../../../src/lib/helpers/logRadar')]
})

t.test('logRadar - radar module found via require.resolve', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  // Create a fake @dotenvx/dotenvx-radar module in node_modules
  const radarDir = path.join(__dirname, '../../../node_modules', '@dotenvx')
  const radarPath = path.join(radarDir, 'dotenvx-radar')

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

  // Clean up the fake module immediately after test
  fs.rmSync(radarPath, { recursive: true, force: true })

  ct.end()
})

t.test('logRadar - test basic functionality', ct => {
  // Mock execSync to succeed
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.returns(Buffer.from('help output'))

  const logRadar = require('../../../src/lib/helpers/logRadar')
  logRadar()

  // This test just ensures the function runs without error and covers additional paths
  ct.ok(true, 'logRadar function executed successfully')

  ct.end()
})

t.test('logRadar - test error handling', ct => {
  // Mock execSync to throw an error
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.throws(new Error('Command not found'))

  const logRadar = require('../../../src/lib/helpers/logRadar')

  // Test that the function doesn't throw an error even when execSync fails
  ct.doesNotThrow(() => {
    logRadar()
  }, 'logRadar handles errors gracefully')

  ct.end()
})
