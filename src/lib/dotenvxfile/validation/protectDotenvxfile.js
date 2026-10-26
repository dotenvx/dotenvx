const path = require('node:path')
const { execFileSync } = require('node:child_process')
const readDotenvxfile = require('../parsing/readDotenvxfile')
const resolveDotenvxfilePath = require('../parsing/resolveDotenvxfilePath')
const plaintextKeys = require('../../helpers/plaintextKeys')

function readPolicy (policyPath, file) {
  const schema = readDotenvxfile(policyPath, [file])
  if (!schema.exists) return null
  return schema
}

// Inspect Git's incoming blob, never the working-tree env values or shell overrides.
module.exports = function protectDotenvxfile (filepath, content) {
  const file = path.resolve(filepath)
  const directory = path.dirname(file)
  let schema = readPolicy(resolveDotenvxfilePath(directory), file)
  if (!schema) {
    let root
    try {
      root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: directory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim()
    } catch {
      // Outside a Git working tree, only an adjacent policy can apply.
      return null
    }
    if (path.resolve(root) !== directory) schema = readPolicy(resolveDotenvxfilePath(root), file)
  }
  if (!schema) return null

  return plaintextKeys(content).filter(key => /^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) || (schema.keys[key]?.fs.encrypted ?? true))
}
