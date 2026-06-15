const fs = require('fs')
const path = require('path')

function escapeForRegex (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function upsertEnvKey (key, value, keysFilepath = '.env.keys') {
  const resolvedKeysFilepath = path.resolve(keysFilepath)
  const keyValueLine = `${key}=${value}`
  const created = !fs.existsSync(resolvedKeysFilepath)

  let src = ''
  if (!created) {
    src = fs.readFileSync(resolvedKeysFilepath, 'utf8')
  }

  const eol = src.includes('\r\n') ? '\r\n' : '\n'
  const keyPattern = new RegExp(`^\\s*(?:export\\s+)?${escapeForRegex(key)}\\s*=`)
  const lines = src.length > 0 ? src.split(/\r?\n/) : []

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  let replaced = false
  const nextLines = []

  for (const line of lines) {
    if (keyPattern.test(line)) {
      if (!replaced) {
        nextLines.push(keyValueLine)
        replaced = true
      }
      continue
    }

    nextLines.push(line)
  }

  if (!replaced) {
    nextLines.push(keyValueLine)
  }

  const nextSrc = `${nextLines.join(eol)}${eol}`
  const changed = created || nextSrc !== src

  if (changed) {
    fs.writeFileSync(resolvedKeysFilepath, nextSrc, 'utf8')
  }

  return {
    changed,
    key,
    value,
    created,
    filepath: keysFilepath
  }
}

module.exports = upsertEnvKey
