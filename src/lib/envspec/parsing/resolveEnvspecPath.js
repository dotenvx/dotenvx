const fs = require('node:fs')
const path = require('node:path')

// A present but broken Dotenvspec must fail, never fall back to a weaker policy.
module.exports = function resolveEnvspecPath (directory = process.cwd()) {
  const preferred = path.resolve(directory, 'Dotenvspec')
  if (fs.lstatSync(preferred, { throwIfNoEntry: false })) return preferred
  const shorthand = path.resolve(directory, 'Envspec')
  if (fs.lstatSync(shorthand, { throwIfNoEntry: false })) return shorthand
  const alternate = path.resolve(directory, 'Dotenvxspec')
  return fs.lstatSync(alternate, { throwIfNoEntry: false }) ? alternate : preferred
}
