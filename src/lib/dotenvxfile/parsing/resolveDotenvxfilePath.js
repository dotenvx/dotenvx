const fs = require('node:fs')
const path = require('node:path')

module.exports = function resolveDotenvxfilePath (directory = process.cwd()) {
  const preferred = path.resolve(directory, 'Dotenvxfile')
  if (fs.existsSync(preferred)) return preferred

  const legacy = path.resolve(directory, 'Envfile')
  if (fs.existsSync(legacy)) return legacy
  return preferred
}
