function readProcessEnvKey (keyName) {
  if (process.env[keyName] && process.env[keyName].length > 0) {
    return process.env[keyName]
  }
}

module.exports = readProcessEnvKey
