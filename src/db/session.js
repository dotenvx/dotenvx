const Vlt = require('./../lib/extensions/vlt')
const { logger } = require('./../shared/logger')

class Session {
  constructor () {
    this.vlt = new Vlt()
  }

  //
  // vlt status helpers
  //
  async noVlt () {
    const status = await this.vlt.status()
    logger.debug(`vlt: ${status}`)
    return status === 'off'
  }

  noVltSync () {
    const status = this.vlt.statusSync()
    logger.debug(`vlt: ${status}`)
    return status === 'off'
  }
}

module.exports = Session
