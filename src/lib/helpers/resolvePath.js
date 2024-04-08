const path = require('path')

// resolve path based on current running process location
function resolvePath (filepath) {
  return path.resolve(process.cwd(), filepath)
}

module.exports = resolvePath
