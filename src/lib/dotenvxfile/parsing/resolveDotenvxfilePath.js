const fsx = require('../../helpers/fsx')
const path = require('node:path')

module.exports = function resolveDotenvxfilePath (directory = process.cwd()) {
  const preferred = path.resolve(directory, 'Dotenvxfile')
  if (fsx.existsSync(preferred)) return preferred

  const legacy = path.resolve(directory, 'Envfile')
  if (fsx.existsSync(legacy)) return legacy
  return preferred
}
