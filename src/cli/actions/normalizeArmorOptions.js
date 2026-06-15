function normalizeArmorOptions (options) {
  if (options.armor === false || options.ops === false) {
    options.armor = false
    options.ops = false
  }

  return options
}

module.exports = normalizeArmorOptions
