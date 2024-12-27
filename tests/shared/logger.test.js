const capcon = require('capture-console')
const t = require('tap')
const sinon = require('sinon')

const packageJson = require('../../src/lib/helpers/packageJson')
const { getColor, bold } = require('../../src/shared/colors')
const { logger, levels } = require('../../src/shared/logger')

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

t.test('logger.blank', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.blank(message)
  })

  ct.equal(stdout, 'message1\n')

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

t.test('logger.errorv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorv(message)
  })

  ct.equal(stdout, `${bold(getColor('red')(`[dotenvx@${packageJson.version}] message1`))}\n`)

  ct.end()
})

t.test('logger.error', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.error(message)
  })

  ct.equal(stdout, `${bold(getColor('red')('message1'))}\n`)

  ct.end()
})

t.test('logger.errornocolor', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errornocolor(message)
  })

  ct.equal(stdout, 'message1\n')

  ct.end()
})

t.test('logger.blank as object', (ct) => {
  const message = { key: 'value' }

  const stdout = capcon.interceptStdout(() => {
    logger.blank(message)
  })

  ct.equal(stdout, `${JSON.stringify({ key: 'value' })}\n`)

  ct.end()
})
