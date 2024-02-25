const path = require('path')

function guessEnvironment (filepath) {
  const filename = path.basename(filepath)
  const parts = filename.split('.')
  const possibleEnvironment = parts[2] // ['', 'env', environment', 'previous']

  if (!possibleEnvironment || possibleEnvironment.length === 0) {
    return 'development'
  }

  return possibleEnvironment
}

module.exports = guessEnvironment
