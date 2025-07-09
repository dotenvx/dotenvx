const t = require('tap')
const sinon = require('sinon')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

t.beforeEach((ct) => {
  sinon.restore()
  // Clear the module cache to ensure fresh instances
  delete require.cache[require.resolve('../../../src/lib/services/radar')]
})

t.afterEach((ct) => {
  sinon.restore()
})

t.test('Radar constructor - npm lib found via require.resolve', ct => {
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

  // Create fake radar module with observe method
  const fakeRadarModule = {
    observe: sinon.stub()
  }

  fs.writeFileSync(path.join(radarPath, 'package.json'), JSON.stringify(fakePackage, null, 2))
  fs.writeFileSync(path.join(radarPath, 'index.js'), `module.exports = ${JSON.stringify(fakeRadarModule, null, 2)};`)

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()

  ct.ok(radar.radarLib, 'radarLib should be set')
  ct.ok(loggerSuccessvStub.calledWith('📡 radar active'), 'logger.successv called when radar module found')

  // Clean up the fake module immediately after test
  fs.rmSync(radarPath, { recursive: true, force: true })

  ct.end()
})

t.test('Radar constructor - npm lib not found, CLI binary available', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  // Mock require.resolve to throw error (npm lib not found)
  const originalResolve = require.resolve
  require.resolve = function (id, options) {
    if (id === '@dotenvx/dotenvx-radar') {
      throw new Error('Module not found')
    }
    return originalResolve.call(this, id, options)
  }

  // Mock execSync to succeed for CLI binary
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.withArgs('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] }).returns('help output')
  execSyncStub.withArgs(sinon.match(/dotenvx-radar observe/), { stdio: 'ignore' }).returns('')

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()

  ct.ok(radar.radarLib, 'radarLib should be set')
  ct.ok(radar.radarLib.observe, 'radarLib should have observe method')
  ct.ok(loggerSuccessvStub.calledWith('📡 radar active'), 'logger.successv called when radar CLI found')

  // Test the CLI observe functionality using the radar instance
  const testPayload = { test: 'data' }
  radar.observe(testPayload)

  const expectedCommand = `dotenvx-radar observe ${Buffer.from(JSON.stringify(testPayload)).toString('base64')}`
  ct.ok(execSyncStub.calledWith(expectedCommand, { stdio: 'ignore' }), 'execSync called with correct command')

  // Restore require.resolve
  require.resolve = originalResolve

  ct.end()
})

t.test('Radar constructor - CLI observe fails gracefully', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  // Mock require.resolve to throw error (npm lib not found)
  const originalResolve = require.resolve
  require.resolve = function (id, options) {
    if (id === '@dotenvx/dotenvx-radar') {
      throw new Error('Module not found')
    }
    return originalResolve.call(this, id, options)
  }

  // Mock execSync to succeed for help but fail for observe
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.withArgs('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] }).returns('help output')
  execSyncStub.withArgs(sinon.match(/dotenvx-radar observe/), { stdio: 'ignore' }).throws(new Error('observe failed'))

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()

  ct.ok(radar.radarLib, 'radarLib should be set')
  ct.ok(loggerSuccessvStub.calledWith('📡 radar active'), 'logger.successv called when radar CLI found')

  // Test the CLI observe functionality with failure using radar instance
  const testPayload = { test: 'data' }
  radar.observe(testPayload)

  ct.ok(loggerDebugStub.calledWith('radar CLI observe failed'), 'logger.debug called when observe fails')

  // Restore require.resolve
  require.resolve = originalResolve

  ct.end()
})

t.test('Radar constructor - neither npm lib nor CLI binary available', ct => {
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  // Mock require.resolve to throw error (npm lib not found)
  const originalResolve = require.resolve
  require.resolve = function (id, options) {
    if (id === '@dotenvx/dotenvx-radar') {
      throw new Error('Module not found')
    }
    return originalResolve.call(this, id, options)
  }

  // Mock execSync to throw error for CLI binary
  const execSyncStub = sinon.stub(childProcess, 'execSync')
  execSyncStub.throws(new Error('Command not found'))

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()

  ct.equal(radar.radarLib, null, 'radarLib should be null when neither option is available')
  ct.ok(loggerSuccessvStub.notCalled, 'logger.successv should not be called when radar is not available')

  // Restore require.resolve
  require.resolve = originalResolve

  ct.end()
})

t.test('observe method - with radarLib available', ct => {
  const mockRadarLib = {
    observe: sinon.stub()
  }

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  radar.radarLib = mockRadarLib

  const testPayload = { test: 'data', key: 'value' }
  radar.observe(testPayload)

  const expectedEncoded = Buffer.from(JSON.stringify(testPayload)).toString('base64')
  ct.ok(mockRadarLib.observe.calledWith(expectedEncoded), 'radarLib.observe called with encoded payload')

  ct.end()
})

t.test('observe method - with radarLib null', ct => {
  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  radar.radarLib = null

  const testPayload = { test: 'data' }
  
  // This should not throw an error
  ct.doesNotThrow(() => {
    radar.observe(testPayload)
  }, 'observe should handle null radarLib gracefully')

  ct.end()
})

t.test('encode method - with simple object', ct => {
  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  
  const testPayload = { test: 'data', number: 123 }
  const result = radar.encode(testPayload)
  
  const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
  ct.equal(result, expected, 'encode should return base64 encoded JSON string')

  ct.end()
})

t.test('encode method - with complex object', ct => {
  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  
  const testPayload = {
    nested: {
      array: [1, 2, 3],
      string: 'test',
      boolean: true,
      null_value: null
    },
    unicode: '🚀 测试'
  }
  const result = radar.encode(testPayload)
  
  const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
  ct.equal(result, expected, 'encode should handle complex objects correctly')

  // Verify it can be decoded back
  const decoded = JSON.parse(Buffer.from(result, 'base64').toString())
  ct.same(decoded, testPayload, 'encoded data should be decodable back to original')

  ct.end()
})

t.test('encode method - with empty object', ct => {
  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  
  const testPayload = {}
  const result = radar.encode(testPayload)
  
  const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
  ct.equal(result, expected, 'encode should handle empty objects')

  ct.end()
})

t.test('full integration - observe with encoding', ct => {
  const mockRadarLib = {
    observe: sinon.stub()
  }

  const Radar = require('../../../src/lib/services/radar')
  const radar = new Radar()
  radar.radarLib = mockRadarLib

  const testPayload = { command: 'test', timestamp: Date.now() }
  radar.observe(testPayload)

  // Verify the encoded payload was passed correctly
  const calls = mockRadarLib.observe.getCalls()
  ct.equal(calls.length, 1, 'observe should be called once')
  
  const encodedPayload = calls[0].args[0]
  const decodedPayload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString())
  ct.same(decodedPayload, testPayload, 'payload should be encoded and passed correctly')

  ct.end()
})