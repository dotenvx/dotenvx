const path = require('node:path')

module.exports = function resolveEnvfilePath (directory = process.cwd()) {
  return path.resolve(directory, 'Envfile')
}
