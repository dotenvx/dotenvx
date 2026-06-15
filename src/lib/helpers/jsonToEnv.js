function jsonToEnv (json) {
  return Object.entries(json).map(function ([key, value]) {
    return key + '=' + `"${value}"`
  }).join('\n')
}

module.exports = jsonToEnv
