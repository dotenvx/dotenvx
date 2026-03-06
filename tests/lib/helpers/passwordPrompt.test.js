const t = require('tap')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const { startIntercept, stopIntercept } = require('capture-console')
const Sinon = require('sinon')
const { logger } = require('../../../src/shared/logger')
const { showLoggerCalls, stubLoggers, allLoggerNames } = require('../../utils/showLoggerCalls')

let loggerStubs

t.beforeEach((ct) => {
  Sinon.restore()
  // logger.setLevel('debug')
  logger.debug(`| ====== start of test: ${ct.name} ======`)
  logger.debug('| Logger level set to debug for test:', ct.name)
  loggerStubs = stubLoggers(allLoggerNames)
})

t.afterEach((ct) => {
  Sinon.restore()
  logger.debug(`| === ${ct.name} logger stub calls:`)
  showLoggerCalls(loggerStubs, ct.name)
  logger.debug(`| ====== end of test: ${ct.name} ======`)
  loggerStubs = {}
})

// ======================================
t.test('#passwordPrompt: throws error when password confirmation doesnt match', async (ct) => {
  // use proxyquire for the 'read' module, called by the passwordPrompt function. 'read' uses (interactive) readline ;
  //   we'll use proxyquire to replace it with a sinon stub that simulates 'read'
  const sinonReadStubPasswordMismatch = Sinon
    .stub()
    .onFirstCall()
    .resolves('myPassword')
    .onSecondCall()
    .resolves('aDifferentPassword')
  // our 'promptForNewPassword' function with the 'read' module stubbed to return two different passwords on successive calls
  const { promptForNewPassword } = proxyquire('../../../src/lib/helpers/passwordPrompt.js', { read: { read: sinonReadStubPasswordMismatch } })
  let newPassword = null
  try {
    newPassword = await promptForNewPassword()
  } catch (err) {
    t.equal(err.message, 'passwords do not match')
  }

  t.equal(newPassword, null)
  ct.end()
})

// ======================================
t.test('#passwordPrompt: returns password when passwords match', async (ct) => {
  let newPassword = null
  // use proxyquire for the 'read' module, called by the passwordPrompt function. 'read' uses (interactive) readline ;
  //   we'll use proxyquire to replace it with a sinon stub that simulates 'read'
  const sinonReadStubPasswordsMatch = Sinon
    .stub()
    .onFirstCall()
    .resolves('newPassword')
    .onSecondCall()
    .resolves('newPassword')
  // our 'promptForNewPassword' function with the 'read' module stubbed to return two IDENTICAL passwords on successive calls
  const { promptForNewPassword } = proxyquire('../../../src/lib/helpers/passwordPrompt.js', { read: { read: sinonReadStubPasswordsMatch } })
  // our buffer
  let stdOutput = ''
  let stdError = ''

  // the first parameter here is the stream to capture, and the
  // second argument is the function receiving the output
  startIntercept(process.stdout, stdout => {
    stdOutput += stdout
  })
  startIntercept(process.stderr, stderr => {
    stdError += stderr
  })
  try {
    newPassword = await promptForNewPassword()
    logger.debug('newPassword:', { newPassword })
  } catch (err) {
    // this is unexpected
    t.fail(err.message)
  }

  stopIntercept(process.stdout)
  stopIntercept(process.stderr)

  // anything logged here is no longer captured
  logger.debug({ stdOutput, stdError, newPassword })
  t.equal(newPassword, 'newPassword')
  ct.end()
})
