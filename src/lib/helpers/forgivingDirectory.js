const path = require('path')

function forgivingDirectory (pathString) {
  if (pathString.endsWith('.env.keys')) {
    return path.dirname(pathString)
  }

  return pathString
}

module.exports = forgivingDirectory
