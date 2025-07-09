const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const capcon = require('capture-console')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')
const packageJson = require('../../../src/lib/helpers/packageJson')
const { getColor, bold } = require('../../../src/shared/colors')

const Radar = require('../../../src/lib/services/radar')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('when no dotenvx-radar', ct => {
  const radar = new Radar()
  ct.equal(radar.radarLib, null)
  ct.doesNotThrow(() => {
    radar.observe({})
  })
  ct.end()
})

t.test('when dotenvx-radar npm', ct => {
  const stub = sinon.stub(Radar.prototype, '_radarNpm').returns({
    observe: sinon.stub()
  })

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-radar cli', ct => {
  const stub = sinon.stub(Radar.prototype, '_radarCli').returns({
    observe: sinon.stub()
  })

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})


// t.test('Radar observe method - with mocked radarLib', ct => {
//   const mockRadarLib = {
//     observe: sinon.stub()
//   }
//
//   const radar = new Radar()
//   radar.radarLib = mockRadarLib
//
//   const testPayload = { test: 'data', key: 'value' }
//   radar.observe(testPayload)
//
//   const expectedEncoded = Buffer.from(JSON.stringify(testPayload)).toString('base64')
//   ct.ok(mockRadarLib.observe.calledWith(expectedEncoded), 'radarLib.observe called with encoded payload')
//
//   ct.end()
// })
//
// t.test('Radar encode method - with simple object', ct => {
//   const radar = new Radar()
//
//   const testPayload = { test: 'data', number: 123 }
//   const result = radar.observe(testPayload)
//
//   const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
//   ct.equal(result, expected, 'encode should return base64 encoded JSON string')
//
//   ct.end()
// })
//
// t.test('Radar observe method - with complex object', ct => {
//   const radar = new Radar()
//
//   const testPayload = {
//     nested: {
//       array: [1, 2, 3],
//       string: 'test',
//       boolean: true,
//       null_value: null
//     },
//     unicode: '🚀 测试'
//   }
//   const result = radar.observe(testPayload)
//
//   const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
//   ct.equal(result, expected, 'encode should handle complex objects correctly')
//
//   // Verify it can be decoded back
//   const decoded = JSON.parse(Buffer.from(result, 'base64').toString())
//   ct.same(decoded, testPayload, 'encoded data should be decodable back to original')
//
//   ct.end()
// })
//
// t.test('Radar observe method - with empty object', ct => {
//   const radar = new Radar()
//
//   const testPayload = {}
//   const result = radar.observe(testPayload)
//
//   const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
//   ct.equal(result, expected, 'observe should handle empty objects')
//
//   ct.end()
// })
//
// t.test('Radar observe method - with arrays and special values', ct => {
//   const radar = new Radar()
//
//   const testPayload = {
//     array: [1, 'string', true, null, { nested: 'object' }],
//     specialChars: 'Hello "World" & <test>',
//     numbers: {
//       int: 42,
//       float: 3.14159,
//       negative: -100
//     }
//   }
//   const result = radar.observe(testPayload)
//
//   const expected = Buffer.from(JSON.stringify(testPayload)).toString('base64')
//   ct.equal(result, expected, 'observe should handle arrays and special values correctly')
//
//   // Verify round-trip encoding/decoding
//   const decoded = JSON.parse(Buffer.from(result, 'base64').toString())
//   ct.same(decoded, testPayload, 'encoded data should survive round-trip conversion')
//
//   ct.end()
// })
//
// t.test('Radar full integration - observe with encoding', ct => {
//   const mockRadarLib = {
//     observe: sinon.stub()
//   }
//
//   const radar = new Radar()
//   radar.radarLib = mockRadarLib
//
//   const testPayload = { command: 'test', timestamp: Date.now() }
//   radar.observe(testPayload)
//
//   // Verify the encoded payload was passed correctly
//   const calls = mockRadarLib.observe.getCalls()
//   ct.equal(calls.length, 1, 'observe should be called once')
//
//   const encodedPayload = calls[0].args[0]
//   const decodedPayload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString())
//   ct.same(decodedPayload, testPayload, 'payload should be encoded and passed correctly')
//
//   ct.end()
// })
//
// t.test('Radar constructor - npm lib found via require.resolve', ct => {
//   const loggerSuccessvStub = sinon.stub(logger, 'successv')
//
//   // Create a fake @dotenvx/dotenvx-radar module in node_modules
//   const radarDir = path.join(__dirname, '../../../node_modules', '@dotenvx')
//   const radarPath = path.join(radarDir, 'dotenvx-radar')
//
//   // Ensure clean state
//   try {
//     fs.rmSync(radarPath, { recursive: true, force: true })
//   } catch (e) {
//     // ignore if doesn't exist
//   }
//
//   // Create the directory structure
//   fs.mkdirSync(radarPath, { recursive: true })
//
//   // Create a simple fake package
//   const fakePackage = {
//     name: '@dotenvx/dotenvx-radar',
//     version: '1.0.0',
//     main: 'index.js'
//   }
//
//   // Create fake radar module with observe method
//   const fakeRadarCode = `
//   module.exports = {
//     observe: function(payload) {
//       // fake observe implementation
//       return payload;
//     }
//   };
//   `
//
//   fs.writeFileSync(path.join(radarPath, 'package.json'), JSON.stringify(fakePackage, null, 2))
//   fs.writeFileSync(path.join(radarPath, 'index.js'), fakeRadarCode)
//
//   // Clear module cache and create fresh instance
//   delete require.cache[require.resolve('../../../src/lib/services/radar')]
//   const FreshRadar = require('../../../src/lib/services/radar')
//   const radar = new FreshRadar()
//
//   ct.ok(radar.radarLib, 'radarLib should be set when npm lib is found')
//   ct.ok(loggerSuccessvStub.calledWith('📡 radar active'), 'logger.successv called when radar module found')
//
//   // Test that observe works with the npm lib
//   const testPayload = { test: 'npm-lib-data' }
//   ct.doesNotThrow(() => {
//     radar.observe(testPayload)
//   }, 'observe should work with npm lib')
//
//   // Clean up the fake module
//   fs.rmSync(radarPath, { recursive: true, force: true })
//
//   ct.end()
// })
//
// t.test('Radar error handling - observe with problematic data', ct => {
//   const radar = new Radar()
//
//   // Test with circular reference (should be handled by JSON.stringify)
//   const circularObj = { a: 1 }
//   circularObj.self = circularObj
//
//   ct.throws(() => {
//     radar.observe(circularObj)
//   }, 'observe should throw error for circular references')
//
//   ct.end()
// })
//
// t.test('Radar fallback to CLI observe when npm lib is not found', ct => {
//   const execStub = sinon.stub(childProcess, 'execSync')
//   // execStub.withArgs('dotenvx-radar help').returns('some help')
//   // execStub.withArgs(sinon.match(/^dotenvx-radar observe/)).returns(null)
//
//   const radar = new Radar()
//   ct.ok(radar.radarLib, 'CLI radarLib should be set')
//
//   const testPayload = { foo: 'bar' }
//   radar.observe(testPayload)
//
//   const encoded = radar.observe(testPayload)
//   ct.ok(execStub.called, 'Should call CLI observe with encoded payload')
//
//   execStub.restore()
//   ct.end()
// })
