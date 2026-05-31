const Armor = require('./../lib/extensions/armor')
const { logger } = require('./../shared/logger')

class Session {
  constructor () {
    this.armor = new Armor()
  }

  //
  // armor status helpers
  //
  async noVlt () {
    const status = await this.armor.status()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  noVltSync () {
    const status = this.armor.statusSync()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }
}

module.exports = Session
