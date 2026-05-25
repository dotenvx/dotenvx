function normalizeOpsOptions (options) {
  if (options.ops === false || options.vlt === false) {
    options.ops = false
    options.vlt = false
  }

  return options
}

module.exports = normalizeOpsOptions
