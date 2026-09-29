const fs = require('node:fs')
const path = require('node:path')
const readEnvspec = require('../parsing/readEnvspec')
const plaintextKeys = require('../../helpers/plaintextKeys')

// Inspect Git's incoming blob, never the working-tree env values or shell overrides.
module.exports = function protectEnvspec (filepath, content) {
  const file = path.resolve(filepath)
  const policyPath = path.join(path.dirname(file), 'Envspec')
  const schema = readEnvspec(policyPath, [file])
  if (!schema.exists) {
    // A dangling policy symlink is a broken policy, not an absent policy.
    if (fs.lstatSync(policyPath, { throwIfNoEntry: false })) throw new Error(`Cannot read Envspec: ${policyPath}`)
    return null
  }

  return plaintextKeys(content).filter(key => /^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) || (schema.encryptionRules.get(key) ?? true))
}
