const chalk = require('chalk')

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const HIDE_CURSOR = '\u001B[?25l'
const SHOW_CURSOR = '\u001B[?25h'
const CLEAR_LINE = '\r\x1b[K'
const SYMBOL_INFO = 'ℹ'
const SYMBOL_WARN = '⚠'
const SYMBOL_ERROR = '✖'
const SYMBOL_SUCCESS = '✔'

class Spinner {
  text
  interval
  frameIndex = 0
  symbol = chalk.blue(FRAMES[0])

  constructor (text) {
    this.text = text
  }

  start (text) {
    if (text) {
      this.text = text
    }
    this.render()
    this.interval = setInterval(() => this.tick(), 50)
  }

  tick () {
    this.symbol = chalk.blue(FRAMES[this.frameIndex++])
    if (this.frameIndex === FRAMES.length - 1) this.frameIndex = 0
    this.render()
  }

  render () {
    process.stdout.write(CLEAR_LINE + HIDE_CURSOR + (this.symbol ? this.symbol + ' ' : '') + this.text)
  }

  succeed (text) {
    if (text) {
      this.text = text
    }
    this.symbol = chalk.green(SYMBOL_SUCCESS)
    this.end()
  }

  info (text) {
    if (text) {
      this.text = text
    }
    this.symbol = chalk.blue(SYMBOL_INFO)
    this.end()
  }

  warn (text) {
    if (text) {
      this.text = text
    }
    this.symbol = chalk.yellow(SYMBOL_WARN)
    this.end()
  }

  fail (text) {
    if (text) {
      this.text = text
    }
    this.symbol = chalk.red(SYMBOL_ERROR)
    this.end()
  }

  stop () {
    this.symbol = ''
    this.end()
  }

  end () {
    this.render()
    clearInterval(this.interval)
    process.stdout.write(SHOW_CURSOR + '\n')
  }
}

const createSpinner = (initialMessage = '') => {
  const spinner = new Spinner(initialMessage)

  return {
    start: (message) => spinner.start(message),
    succeed: (message) => spinner.succeed(chalk.keyword('green')(message)),
    warn: (message) => spinner.warn(chalk.keyword('orangered')(message)),
    info: (message) => spinner.info(chalk.keyword('blue')(message)),
    done: (message) => spinner.succeed(message),
    fail: (message) => spinner.fail(chalk.bold.red(message))
  }
}

module.exports = { createSpinner, Spinner }
