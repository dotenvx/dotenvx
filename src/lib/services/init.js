const fs = require('node:fs')
const path = require('node:path')
const { scan, encrypted } = require('@dotenvx/primitives')

const normalizeEnvspec = require('../envspec/rendering/normalizeEnvspec')
const renderEnvspec = require('../envspec/rendering/renderEnvspec')
const isPublicKey = require('../helpers/isPublicKey')

function declaration (name) {
  const item = { name }
  if (/(^|_)port$/i.test(name)) item.type = 'port'
  if (/(^|_)url$/i.test(name)) item.type = 'url'
  if (isPublicKey(name)) item.redacted = false
  return item
}

module.exports = function init ({ directory = process.cwd(), envFile, envFiles, sourceKeys = [], overwrite = false, stdout = false, onFile = () => {} } = {}) {
  const target = path.resolve(directory, 'Dotenvspec')
  const existing = stdout ? undefined : fs.lstatSync(target, { throwIfNoEntry: false })
  if (existing && !overwrite) return { created: false }
  if (existing && !existing.isFile()) throw new Error(`Cannot replace Dotenvspec: expected a regular file (${target})`)
  const seen = new Set()

  const sources = []
  const names = new Set()
  const files = []
  const candidates = envFiles || (envFile ? [envFile] : ['.env.example', '.env'])
  const relativeFilename = candidate => path.relative(path.resolve(directory), path.resolve(directory, candidate)).split(path.sep).join('/')
  for (const candidate of candidates) {
    const resolved = path.resolve(directory, candidate)
    if (seen.has(resolved)) continue
    seen.add(resolved)
    let src
    try {
      src = fs.readFileSync(path.resolve(directory, candidate), 'utf8')
    } catch (error) {
      if (envFiles || envFile || error.code !== 'ENOENT') throw error
      continue
    }
    onFile(candidate)
    sources.push(candidate)
    // scan preserves every assignment as an array, without decrypting or expanding.
    const allEntries = Object.entries(scan(src).parsed)
    const entries = allEntries.filter(([key]) => !key.startsWith('DOTENV_PUBLIC_KEY'))
    for (const [key] of entries) {
      if (!/^DOTENV_PRIVATE_KEY(?:_|$)/.test(key)) names.add(key)
    }
    const hasEncryptedValues = entries.some(([key, values]) => !/^DOTENV_PRIVATE_KEY(?:_|$)/.test(key) && values.some(value => encrypted(value)))
    files.push({
      filename: relativeFilename(candidate),
      hasValues: entries.length > 0,
      declarations: entries.filter(([key]) => !/^DOTENV_PRIVATE_KEY(?:_|$)/.test(key)).map(([key, values]) => ({
        ...declaration(key), encrypted: values.some(value => encrypted(value)) || (!hasEncryptedValues && !key.endsWith('_PLAIN'))
      }))
    })
  }

  const inputCount = names.size
  const codeDeclarations = sourceKeys.filter(key => !/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)).map(declaration)
  for (const item of codeDeclarations) names.add(item.name)
  const addedFromSource = names.size - inputCount
  const keys = [...names]
  const invalid = keys.filter(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
  if (invalid.length) throw new Error(`Unsupported Dotenvspec variable names: ${invalid.join(', ')}`)

  const document = normalizeEnvspec({ files, codeDeclarations })
  const content = renderEnvspec(document)
  if (stdout) return { created: false, content }
  try {
    fs.writeFileSync(target, content, { flag: overwrite ? fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW : 'wx' })
  } catch (error) {
    if (error.code === 'EEXIST') return { created: false }
    throw error
  }
  return { created: true, replaced: Boolean(existing), source: sources.join(', '), count: keys.length, addedFromSource }
}
