function resolveLockPassword (options = {}) {
  return options.lockPassword !== undefined ? options.lockPassword : process.env.DOTENVX_LOCK_PASSWORD
}

module.exports = resolveLockPassword
