const capcon = require('capture-console')
const chalk = require('chalk')
const t = require('tap')

const { createSpinner, Spinner } = require('../../src/shared/createSpinner')

const HIDE_CURSOR = '\u001B[?25l'
const SHOW_CURSOR = '\u001B[?25h'
const CLEAR_LINE = '\r\x1b[K'

t.test('spinnerClass.end', (ct) => {
  const spinner = new Spinner('encrypting')

  const stdout = capcon.interceptStdout(() => {
    spinner.end()
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + chalk.blue('⠋') + ' encrypting' + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinnerClass.tick', (ct) => {
  const spinner = new Spinner('encrypting')

  const stdout = capcon.interceptStdout(() => {
    spinner.tick()
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + chalk.blue('⠋') + ' encrypting')

  ct.end()
})

t.test('spinnerClass.tick frame 10', (ct) => {
  const spinner = new Spinner('encrypting')

  const stdout = capcon.interceptStdout(() => {
    spinner.frameIndex = 8
    spinner.tick()
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + chalk.blue('⠇') + ' encrypting')

  ct.end()
})

t.test('spinnerClass.stop', (ct) => {
  const spinner = new Spinner('encrypting')

  const stdout = capcon.interceptStdout(() => {
    spinner.stop()
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + 'encrypting' + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinner.done', (ct) => {
  const spinner = createSpinner('encrypting')

  const stdout = capcon.interceptStdout(() => {
    spinner.start('message1')
    spinner.done()
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + chalk.blue('⠋') + ' message1' + CLEAR_LINE + HIDE_CURSOR + chalk.green('✔') + ' message1' + SHOW_CURSOR + '\n')
  ct.end()
})

t.test('spinner.succeed', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.succeed(message)
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + `${chalk.green('✔')} ${chalk.keyword('green')('message1')}` + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinner.warn', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.warn(message)
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + `${chalk.yellow('⚠')} ${chalk.keyword('orangered')('message1')}` + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinner.fail', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.fail(message)
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + `${chalk.red('✖')} ${chalk.bold.red('message1')}` + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinner.info', (ct) => {
  const spinner = createSpinner('encrypting')
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.info(message)
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + `${chalk.blue('ℹ')} ${chalk.keyword('blue')('message1')}` + SHOW_CURSOR + '\n')

  ct.end()
})

t.test('spinner.info (undefined)', (ct) => {
  const spinner = createSpinner()
  const message = 'message1'

  const stdout = capcon.interceptStdout(() => {
    spinner.info(message)
  })

  ct.equal(stdout, CLEAR_LINE + HIDE_CURSOR + `${chalk.blue('ℹ')} ${chalk.keyword('blue')('message1')}` + SHOW_CURSOR + '\n')

  ct.end()
})
