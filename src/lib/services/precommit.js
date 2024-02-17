const logger = require('./../../shared/logger')

const InstallPrecommitHook = require('./../helpers/installPrecommitHook')

class Precommit {
  constructor (options = {}) {
    this.install = options.install
  }

  run () {
    if (this.install) {
      this._installPrecommitHook()

      return true
    }

    logger.info('implement')
  }

  /* istanbul ignore next */
  _installPrecommitHook () {
    new InstallPrecommitHook().run()
  }
}

module.exports = Precommit
