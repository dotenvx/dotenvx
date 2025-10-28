// Utilities to stub logger methods with sinon stubs, and to output information about the calls made to the stubs
const sinon = require('sinon')
const { logger, levels: loggerLevels } = require('../../src/shared/logger')

// ===== jsdoc/tsdoc type imports and definitions
/** @typedef {import('../../src/shared/logger').LogLevelName} LogLevelName */
/** @typedef {import('../../src/shared/logger').Logger} Logger */
/** @typedef {import('../../src/shared/logger').LoggerObject} LoggerObject */
/** @typedef {import('../../src/shared/logger').LogFunction} LogFunction */
/** @typedef {import('sinon').SinonStubbedFunction<LogFunction>} SinonStubbedFunction */
/**
 * A sinon stub for a log function
 * @typedef {SinonStubbedFunction<LogFunction>} SinonStubbedLogger
 */
/**
 * A map of logger method names to sinon stubs
 * @typedef {{[loggerName: LogLevelName]: SinonStubbedLogger}} SinonStubbedLoggerSet
 */

// ===== main

/** @type {LogLevelName[]} */
const allLoggerNames = Object.keys(loggerLevels)

/**
 * Stubs logger methods with sinon stubs.
 * @param {LogLevelName[]} loggerNamesArray - array of logger method names to stub
 * @returns {SinonStubbedLoggerSet}
 * @example
 * ```js
 * let loggerStubs
 *
 * t.beforeEach((ct) => {
 *   sinon.restore()
 *   logger.setLevel('debug')
 *   logger.debug(`| ====== start of test: ${ct.name} ======`)
 *   logger.debug('| Logger level set to debug for test:', ct.name)
 *   loggerStubs = stubLoggers(allLoggerNames)
 * })
 *
 * t.afterEach((ct) => {
 *   sinon.restore()
 *   console.log(`| === ${ct.name} logger stub calls:`)
 *   showLoggerCalls(loggerStubs, ct.name)
 *   console.log(`| ====== end of test: ${ct.name} ======`)
 *   loggerStubs = {}
 * })
 *
 * t.test('example test', ct => {
 *   myMethodThatUsesLogger(); // method that calls logger.debug("foo")
 *
 *   t.ok(loggerStubs.debug.calledWithMatch('foo'), 'logger.debug called with "foo"')
 * })
 * ```
 */
function stubLoggers (loggerNamesArray) {
  /** @type {SinonStubbedLoggerSet} */
  const logStubs = {}
  for (const loggerName of loggerNamesArray) {
    logStubs[loggerName] = sinon.stub(logger, loggerName)
  }
  return logStubs
}

/**
 * Outputs information via logger.debug, about the calls made to the logger stubs during a test.
 *
 * NB: You should call sinon.restore() BEFORE you call this function, or the logger.debug() output will be intercepted by your sinon stub for logger.debug()
 * @param {{[loggerName: LogLevelName]: SinonStubbedLogger}} loggerStubsObject - object with logger method names as keys and sinon stubs as values
 * @param {string} testName - name of the test being run
 */
function showLoggerCalls (loggerStubsObject, testName) {
  for (const loggerName of Object.keys(loggerStubsObject)) {
    logger.debug(`| ${testName}: logger ${loggerName} was called ${loggerStubsObject[loggerName].callCount} times: `)
    let callCount = 1
    for (const call of loggerStubsObject[loggerName].getCalls()) {
      logger.debug(`| (${testName} ${loggerName} call ${callCount}) THIS:`, call.thisValue)
      logger.debug(`| (${testName} ${loggerName} call ${callCount}) ARGS:`, call.args)
      logger.debug(`| (${testName} ${loggerName} call ${callCount}) EXCEPTION:`, call.exception)
      logger.debug(`| (${testName} ${loggerName} call ${callCount}) RETURNVAL:`, call.returnValue)
      callCount++
    }
  }
}

module.exports = {
  allLoggerNames,
  stubLoggers,
  showLoggerCalls
}
