const execa = require('execa')

const execute = {
  execa (command, args, options) {
    return execa(command, args, options)
  }
}

module.exports = execute
