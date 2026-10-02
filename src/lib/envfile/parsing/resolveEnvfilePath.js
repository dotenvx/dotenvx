const fs = require('node:fs')
const path = require('node:path')

// A present but broken policy must fail, never fall back to a weaker policy.
module.exports = function resolveEnvfilePath (directory = process.cwd()) {
  for (const filename of ['Envfile', 'Envspec', 'Dotenvspec']) {
    const candidate = path.resolve(directory, filename)
    if (fs.lstatSync(candidate, { throwIfNoEntry: false })) return candidate
  }
  return path.resolve(directory, 'Envfile')
}
