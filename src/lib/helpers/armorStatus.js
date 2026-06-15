const Armor = require('./../extensions/armor')
const { logger } = require('./../../shared/logger')

async function noArmor () {
  const status = await new Armor().status()
  logger.debug(`armor: ${status}`)
  return status === 'off'
}

function noArmorSync () {
  const status = new Armor().statusSync()
  logger.debug(`armor: ${status}`)
  return status === 'off'
}

module.exports = {
  noArmor,
  noArmorSync
}
