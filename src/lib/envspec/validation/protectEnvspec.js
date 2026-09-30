const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const readEnvspec = require('../parsing/readEnvspec')
const resolveEnvspecPath = require('../parsing/resolveEnvspecPath')
const plaintextKeys = require('../../helpers/plaintextKeys')

function readPolicy (policyPath, file) {
  const schema = readEnvspec(policyPath, [file])
  if (!schema.exists) {
    // A dangling policy symlink is a broken policy, not an absent policy.
    if (fs.lstatSync(policyPath, { throwIfNoEntry: false })) throw new Error(`Cannot read Dotenvspec: ${policyPath}`)
    return null
  }
  return schema
}

// Inspect Git's incoming blob, never the working-tree env values or shell overrides.
module.exports = function protectEnvspec (filepath, content) {
  const file = path.resolve(filepath)
  const directory = path.dirname(file)
  let schema = process.env.DOTENV_SPEC !== undefined
    ? readEnvspec(undefined, [file])
    : readPolicy(resolveEnvspecPath(directory), file)
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
    if (path.resolve(root) !== directory) schema = readPolicy(resolveEnvspecPath(root), file)
  }
  if (!schema) return null

  return plaintextKeys(content).filter(key => /^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) || (schema.encryptionRules.get(key) ?? true))
}
