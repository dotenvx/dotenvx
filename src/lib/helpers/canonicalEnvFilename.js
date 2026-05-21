const path = require('path')

function canonicalEnvFilename (filepath) {
  let filename = path.basename(filepath).toLowerCase()

  if (filename.startsWith('.env') && filename.endsWith('.txt')) {
    filename = filename.slice(0, -4)
  }

  return filename
}

module.exports = canonicalEnvFilename
