const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const readEnvfile = require('../parsing/readEnvfile')
const resolveEnvfilePath = require('../parsing/resolveEnvfilePath')
const plaintextKeys = require('../../helpers/plaintextKeys')

function readPolicy (policyPath, file) {
  const schema = readEnvfile(policyPath, [file])
  if (!schema.exists) {
    // A dangling policy symlink is a broken policy, not an absent policy.
    if (fs.lstatSync(policyPath, { throwIfNoEntry: false })) throw new Error(`Cannot read Envfile: ${policyPath}`)
    return null
  }
  return schema
}

// Inspect Git's incoming blob, never the working-tree env values or shell overrides.
module.exports = function protectEnvfile (filepath, content) {
  const file = path.resolve(filepath)
  const directory = path.dirname(file)
  let schema = readPolicy(resolveEnvfilePath(directory), file)
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
    if (path.resolve(root) !== directory) schema = readPolicy(resolveEnvfilePath(root), file)
  }
  if (!schema) return null

  return plaintextKeys(content).filter(key => /^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) || (schema.encryptionRules.get(key) ?? true))
}
