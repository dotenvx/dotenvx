const fs = require('node:fs')
const path = require('node:path')

module.exports = function resolveEnvfilePath (directory = process.cwd()) {
  const preferred = path.resolve(directory, 'Superenv')
  if (fs.lstatSync(preferred, { throwIfNoEntry: false })) return preferred
  const legacy = path.resolve(directory, 'Envfile')
  return fs.lstatSync(legacy, { throwIfNoEntry: false }) ? legacy : preferred
}
