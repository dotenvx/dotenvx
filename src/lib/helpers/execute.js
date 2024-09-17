const execa = require('execa')
const pkgArgs = process.pkg ? { PKG_EXECPATH: "" } : {}

const execute = {
  execa (command, args, options) {
    return execa(command, args, { ...options, env: { ...options.env, ...pkgArgs } })
  }
}

module.exports = execute
