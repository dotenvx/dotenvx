const capcon = require('capture-console')
const t = require('tap')
const pc = require('picocolors')
const sinon = require('sinon')

const packageJson = require('../../src/lib/helpers/packageJson')
const { getColor, logger } = require('../../src/shared/logger')

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

t.test('logger.http', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.http(message)
  })

  ct.equal(stdout, '') // blank because log level

  ct.end()
})

t.test('logger.help2', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.help2(message)
  })

  ct.equal(stdout, `${getColor('gray')('message1')}\n`)

  ct.end()
})

t.test('logger.help', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.help(message)
  })

  ct.equal(stdout, `${getColor('blue')('message1')}\n`)

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

t.test('logger.successvpb', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successvpb(message)
  })

  ct.equal(stdout, `${getColor('green')(`[dotenvx@${packageJson.version}][prebuild] message1`)}\n`)

  ct.end()
})

t.test('logger.successvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successvp(message)
  })

  ct.equal(stdout, `${getColor('green')(`[dotenvx@${packageJson.version}][precommit] message1`)}\n`)

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

t.test('logger.warnvpb', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnvpb(message)
  })

  ct.equal(stdout, `${getColor('orangered')(`[dotenvx@${packageJson.version}][prebuild] message1`)}\n`)

  ct.end()
})

t.test('logger.warnvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnvp(message)
  })

  ct.equal(stdout, `${getColor('orangered')(`[dotenvx@${packageJson.version}][precommit] message1`)}\n`)

  ct.end()
})

t.test('logger.warnv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnv(message)
  })

  ct.equal(stdout, `${getColor('orangered')(`[dotenvx@${packageJson.version}] message1`)}\n`)

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

t.test('logger.errorvpb', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorvpb(message)
  })

  ct.equal(stdout, `${pc.bold(pc.red(`[dotenvx@${packageJson.version}][prebuild] message1`))}\n`)

  ct.end()
})

t.test('logger.errorvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorvp(message)
  })

  ct.equal(stdout, `${pc.bold(pc.red(`[dotenvx@${packageJson.version}][precommit] message1`))}\n`)

  ct.end()
})

t.test('logger.errorv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorv(message)
  })

  ct.equal(stdout, `${pc.bold(pc.red(`[dotenvx@${packageJson.version}] message1`))}\n`)

  ct.end()
})

t.test('logger.error', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.error(message)
  })

  ct.equal(stdout, `${pc.bold(pc.red('message1'))}\n`)

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

t.test('getColor with color support', (ct) => {
  const stub = sinon.stub(pc, 'isColorSupported').value(true)

  ct.equal(getColor('orangered')('hello'), '\x1b[38;5;202mhello\x1b[39m')

  stub.restore()
  ct.end()
})

t.test('getColor without color support', (ct) => {
  const stub = sinon.stub(pc, 'isColorSupported').value(false)

  ct.equal(getColor('orangered')('hello'), 'hello')

  stub.restore()
  ct.end()
})

t.test('getColor invalid color', (ct) => {
  try {
    getColor('invalid')

    ct.fail('getColor should throw error')
  } catch (error) {
    ct.pass(' threw an error')
    ct.equal(error.message, 'Invalid color invalid')
  }

  ct.end()
})
