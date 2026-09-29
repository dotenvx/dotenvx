const fs = require('node:fs')
const path = require('node:path')

const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor', '.venv', 'coverage', '__pycache__'])

// Discover selectable inputs without reading their values. Env files are often
// gitignored, so .gitignore must not hide them from this checklist.
module.exports = function discoverEnvFiles ({ directory = process.cwd() } = {}) {
  const root = path.resolve(directory)
  const files = []
  function walk (current) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    // Stop at nested packages and initialized projects, including symlinked markers.
    if (current !== root && entries.some(entry => entry.name === 'Envspec' || entry.name === 'package.json')) return
    for (const entry of entries) {
      const filename = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name) && !entry.name.startsWith('.env')) walk(filename)
        continue
      }
      if (entry.name !== '.env' && !entry.name.startsWith('.env.')) continue
      if (/^\.env\.(schema|x)$/.test(entry.name) || /^\.env\.(keys|vault)(\.|$)/.test(entry.name)) continue
      if (!entry.isFile() && !(entry.isSymbolicLink() && fs.statSync(filename, { throwIfNoEntry: false })?.isFile())) continue
      files.push(path.relative(root, filename).split(path.sep).join('/'))
    }
  }
  walk(root)
  return files.sort()
}
