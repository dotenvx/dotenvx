const capcon = require('capture-console')
const t = require('tap')
const sinon = require('sinon')

const packageJson = require('../../src/lib/helpers/packageJson')
const { getColor, bold } = require('../../src/shared/colors')
const { setLogName, setLogVersion, logger, levels } = require('../../src/shared/logger')

t.beforeEach((ct) => {
  logger.setName('dotenvx')
  logger.setVersion(packageJson.version)
})

t.test('throws error for missing log level', (ct) => {
  // Backup the original levels
  const originalLevels = { ...levels }

  // Remove the "info" level
  delete levels.info

  // Stub console.log to avoid actual logging during the test
  const logStub = sinon.stub(console, 'log')

  t.throws(() => {
    logger.info('This should throw an error')
  }, /MISSING_LOG_LEVEL/, 'Throws error for missing log level')

  // Restore the original levels
  Object.assign(levels, originalLevels)

  // Restore console.log
  logStub.restore()

  ct.end()
})

t.test('logger.debug', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.debug(message)
  })

  ct.equal(stdout, '') // blank because log level

  ct.end()
})

t.test('logger.verbose', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.verbose(message)
  })

  ct.equal(stdout, '') // blank because log level

  ct.end()
})

t.test('logger.help', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.help(message)
  })

  ct.equal(stdout, `${getColor('dodgerblue')('message1')}\n`)

  ct.end()
})

t.test('logger.info', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.info(message)
  })

  ct.equal(stdout, 'message1\n')

  ct.end()
})

t.test('logger.successv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('logger.successv change logger name', (ct) => {
  const message = 'message1'

  logger.setName('dotenvx-pro')

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')(`[dotenvx-pro@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('logger.successv change logger name and logger version', (ct) => {
  const message = 'message1'

  logger.setName('dotenvx-pro')
  logger.setVersion('0.1.1')

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')('[dotenvx-pro@0.1.1] message1')}\n`)

  ct.end()
})

t.test('logger.success', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.success(message)
  })

  ct.equal(stdout, `${getColor('green')('message1')}\n`)

  ct.end()
})

t.test('logger.warn', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warn(message)
  })

  ct.equal(stdout, `${getColor('orangered')('message1')}\n`)

  ct.end()
})

t.test('logger.error', (ct) => {
  const message = 'message1'

  const stderr = capcon.interceptStderr(() => {
    logger.error(message)
  })

  ct.equal(stderr, `${bold(getColor('red')('message1'))}\n`)

  ct.end()
})

t.test('logger.info as object', (ct) => {
  const message = { key: 'value' }

  const stdout = capcon.interceptStdout(() => {
    logger.info(message)
  })

  ct.equal(stdout, `${JSON.stringify({ key: 'value' })}\n`)

  ct.end()
})

t.test('setLogName', (ct) => {
  setLogName({ logName: 'dude' })

  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')(`[dude@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('setLogName undefined does nothing', (ct) => {
  setLogName({})

  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('setLogVersion', (ct) => {
  setLogVersion({ logVersion: '0.0.1' })

  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')('[dotenvx@0.0.1] message1')}\n`)

  ct.end()
})

t.test('setLogVersion undefined does nothing', (ct) => {
  setLogVersion({})

  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})
