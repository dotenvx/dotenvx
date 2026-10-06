const store = require('./store')

module.exports = {
  id: 'armored',
  name: '⛨ Armor',
  custody: 'managed',
  enabled: (options = {}) => options.noArmor !== true && options.armor !== false && process.env.DOTENVX_NO_ARMOR !== 'true',
  available: () => true,
  store
}
