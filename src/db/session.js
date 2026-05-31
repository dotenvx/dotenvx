const Armor = require('./../lib/extensions/armor')
const { logger } = require('./../shared/logger')

class Session {
  constructor () {
    this.armor = new Armor()
  }

  //
  // armor status helpers
  //
  async noArmor () {
    const status = await this.armor.status()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  noArmorSync () {
    const status = this.armor.statusSync()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }
}

module.exports = Session
