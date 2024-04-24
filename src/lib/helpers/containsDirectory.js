const path = require('path')

function containsDirectory (filepath) {
  return filepath.includes(path.sep)
}

module.exports = containsDirectory
