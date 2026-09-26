const fs = require('node:fs')
const path = require('node:path')
const { scan, encrypted } = require('@dotenvx/primitives')

const normalizeEnvfile = require('../helpers/normalizeEnvfile')
const renderEnvfile = require('../helpers/renderEnvfile')

function declaration (name) {
  if (/(^|_)port$/i.test(name)) return { name, type: 'port' }
  if (/(^|_)url$/i.test(name)) return { name, type: 'url' }
  return { name }
}

module.exports = function init ({ directory = process.cwd(), envFile, envFiles, sourceKeys = [], onFile = () => {} } = {}) {
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
  const files = []
  const candidates = envFiles || (envFile ? [envFile] : ['.env.example', '.env'])
  const relativeFilename = candidate => path.relative(path.resolve(directory), path.resolve(directory, candidate)).split(path.sep).join('/')
  for (const candidate of candidates) {
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
    const entries = Object.entries(scan(src).parsed).filter(([key]) => !key.startsWith('DOTENV_PUBLIC_KEY'))
    for (const [key] of entries) {
      if (!/^DOTENV_PRIVATE_KEY(?:_|$)/.test(key)) names.add(key)
    }
    files.push({
      filename: relativeFilename(candidate),
      hasValues: entries.length > 0,
      encrypted: entries.length > 0 && entries.every(([, values]) => values.every(value => encrypted(value))),
      declarations: entries.filter(([key]) => !/^DOTENV_PRIVATE_KEY(?:_|$)/.test(key)).map(([key, values]) => ({
        ...declaration(key), encrypted: values.some(value => encrypted(value))
      }))
    })
  }

  const inputCount = names.size
  const codeDeclarations = sourceKeys.filter(key => !/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)).map(declaration)
  for (const item of codeDeclarations) names.add(item.name)
  const addedFromSource = names.size - inputCount
  const keys = [...names]
  const invalid = keys.filter(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
  if (invalid.length) throw new Error(`Unsupported Envfile variable names: ${invalid.join(', ')}`)

  const document = normalizeEnvfile({ files, codeDeclarations })
  const content = renderEnvfile(document)
  try {
    fs.writeFileSync(target, content, { flag: 'wx' })
  } catch (error) {
    if (error.code === 'EEXIST') return { created: false }
    throw error
  }
  return { created: true, source: sources.join(', '), count: keys.length, addedFromSource }
}
