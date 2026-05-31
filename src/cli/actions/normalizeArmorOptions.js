function normalizeArmorOptions (options) {
  if (options.armor === false || options.ops === false || options.vlt === false) {
    options.armor = false
    options.ops = false
    options.vlt = false
  }

  return options
}

module.exports = normalizeArmorOptions
