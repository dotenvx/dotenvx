const capcon = require('capture-console')
const t = require('tap')
const chalk = require('chalk')

const packageJson = require('../../src/shared/packageJson')
const logger = require('../../src/shared/logger')

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

  ct.equal(stdout, `${chalk.keyword('gray')('message1')}\n`)

  ct.end()
})

t.test('logger.help', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.help(message)
  })

  ct.equal(stdout, `${chalk.keyword('blue')('message1')}\n`)

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

  ct.equal(stdout, `${chalk.keyword('green')(`[dotenvx@${packageJson.version}][prebuild] message1`)}\n`)

  ct.end()
})

t.test('logger.successvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successvp(message)
  })

  ct.equal(stdout, `${chalk.keyword('green')(`[dotenvx@${packageJson.version}][precommit] message1`)}\n`)

  ct.end()
})

t.test('logger.successv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.successv(message)
  })

  ct.equal(stdout, `${chalk.keyword('olive')(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('logger.success', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.success(message)
  })

  ct.equal(stdout, `${chalk.keyword('green')('message1')}\n`)

  ct.end()
})

t.test('logger.warnvpb', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnvpb(message)
  })

  ct.equal(stdout, `${chalk.keyword('orangered')(`[dotenvx@${packageJson.version}][prebuild] message1`)}\n`)

  ct.end()
})

t.test('logger.warnvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnvp(message)
  })

  ct.equal(stdout, `${chalk.keyword('orangered')(`[dotenvx@${packageJson.version}][precommit] message1`)}\n`)

  ct.end()
})

t.test('logger.warnv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warnv(message)
  })

  ct.equal(stdout, `${chalk.keyword('orangered')(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('logger.warn', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.warn(message)
  })

  ct.equal(stdout, `${chalk.keyword('orangered')('message1')}\n`)

  ct.end()
})

t.test('logger.errorvpb', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorvpb(message)
  })

  ct.equal(stdout, `${chalk.bold.red(`[dotenvx@${packageJson.version}][prebuild] message1`)}\n`)

  ct.end()
})

t.test('logger.errorvp', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorvp(message)
  })

  ct.equal(stdout, `${chalk.bold.red(`[dotenvx@${packageJson.version}][precommit] message1`)}\n`)

  ct.end()
})

t.test('logger.errorv', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.errorv(message)
  })

  ct.equal(stdout, `${chalk.bold.red(`[dotenvx@${packageJson.version}] message1`)}\n`)

  ct.end()
})

t.test('logger.error', (ct) => {
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    logger.error(message)
  })

  ct.equal(stdout, `${chalk.bold.red('message1')}\n`)

  ct.end()
})
