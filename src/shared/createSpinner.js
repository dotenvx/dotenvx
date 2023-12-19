const ora = require('ora')
const chalk = require('chalk')

const createSpinner = function(initialMessage = '') {
  const spinner = ora(initialMessage)

  return {
    start: (message) => spinner.start(message),
    succeed: (message) => spinner.succeed(chalk.keyword('green')(message)),
    done: (message) => spinner.succeed(message),
    fail: (message) => spinner.fail(chalk.bold.red(message))
  }
}

module.exports = createSpinner
