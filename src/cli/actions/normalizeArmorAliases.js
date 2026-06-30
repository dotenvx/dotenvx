function normalizeArmorAliases (options) {
  if (options.ops === false) {
    options.armor = false
  }

  return options
}

module.exports = normalizeArmorAliases
