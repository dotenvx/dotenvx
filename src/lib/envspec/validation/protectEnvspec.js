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

  if (schema.commit === false) {
    throw new Error(`[COMMIT_DISABLED] refusing to stage ${JSON.stringify(filepath)}: commit false in Envspec`)
  }
  const plaintext = plaintextKeys(content)
  const rejected = plaintext.filter(key => /^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) || (schema.encryptionRules.get(key) ?? schema.encrypted))
  if (schema.commit !== true) {
    return {
      rejected: null,
      commitRequired: plaintext.length > 0 && rejected.length === 0
    }
  }
  return { rejected }
}
