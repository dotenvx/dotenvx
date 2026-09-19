const fs = require('node:fs')
const path = require('node:path')
const { scan, encrypted } = require('@dotenvx/primitives')

const examples = `# Required by default; explicitly required or optional:
# env "DATABASE_URL", required: true
# env "SENTRY_DSN", optional: true
#
# Require encryption for one variable, or exempt it from the default:
# env "API_KEY", encrypted: true
# env "PUBLIC_URL", encrypted: false
#
# Types validate resolved values:
# env "DATABASE_URL", type: "url"
# env "WORKERS", type: "integer", min: 1, max: 16
# env "DEBUG", type: "boolean"
# env "PORT", type: "port"
# env "SUPPORT_EMAIL", type: "email"
# env "BIND_ADDRESS", type: "ip"
#
# Allowed values:
# env "NODE_ENV", enum: ["development", "test", "production"]
# env "RETRIES", type: "integer", enum: [0, 1, 3]
#
# File-specific rules (exact path relative to Envfile; inherits root rules):
# file ".env.production" do
#   encrypted true
#   env "DATABASE_URL", type: "url"
#   env "PORT", type: "port", encrypted: false
# end
#
# Credential proxy (requires Armor and an encrypted value in an env file):
# env "OPENAI_API_KEY", proxy: { domain: "api.openai.com" }
`

module.exports = function init ({ directory = process.cwd(), envFile } = {}) {
  const target = path.resolve(directory, 'Envfile')
  // lstat also preserves dangling symlinks. Never overwrite an existing Envfile.
  try {
    fs.lstatSync(target)
    return { created: false }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const sources = []
  const names = new Set()
  let requireEncryption = false
  for (const candidate of envFile ? [envFile] : ['.env.example', '.env']) {
    let src
    try {
      src = fs.readFileSync(path.resolve(directory, candidate), 'utf8')
    } catch (error) {
      if (envFile || error.code !== 'ENOENT') throw error
      continue
    }
    sources.push(candidate)
    // scan preserves every assignment as an array, without decrypting or expanding.
    for (const [key, values] of Object.entries(scan(src).parsed)) {
      if (/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)) continue
      names.add(key)
      if (values.some(value => encrypted(value))) requireEncryption = true
    }
  }

  const keys = [...names]
  const invalid = keys.filter(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
  if (invalid.length) throw new Error(`Unsupported Envfile variable names: ${invalid.join(', ')}`)

  const declarations = keys.map(key => `env "${key}"`).join('\n')
  const content = `encrypted ${requireEncryption}\n\n` +
    (declarations ? `${declarations}\n\n` : '# Add your env declarations here. See examples below.\n\n') + examples
  try {
    fs.writeFileSync(target, content, { flag: 'wx' })
  } catch (error) {
    if (error.code === 'EEXIST') return { created: false }
    throw error
  }
  return { created: true, source: sources.join(', '), count: keys.length }
}
