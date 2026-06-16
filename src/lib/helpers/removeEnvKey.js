const fs = require('fs')
const path = require('path')

function escapeForRegex (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removeEnvKey (key, keysFilepath = '.env.keys') {
  const resolvedKeysFilepath = path.resolve(keysFilepath)

  if (!fs.existsSync(resolvedKeysFilepath)) {
    return {
      changed: false,
      key,
      filepath: keysFilepath
    }
  }

  const src = fs.readFileSync(resolvedKeysFilepath, 'utf8')
  const eol = src.includes('\r\n') ? '\r\n' : '\n'
  const keyPattern = new RegExp(`^\\s*(?:export\\s+)?${escapeForRegex(key)}\\s*=`)
  const envKeyPattern = /^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=/
  const lines = src.length > 0 ? src.split(/\r?\n/) : []

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  const nextLines = lines.filter((line) => !keyPattern.test(line))
  const changed = nextLines.length !== lines.length

  if (changed) {
    const hasRemainingKeys = nextLines.some((line) => envKeyPattern.test(line))

    if (hasRemainingKeys) {
      const nextSrc = `${nextLines.join(eol)}${eol}`
      fs.writeFileSync(resolvedKeysFilepath, nextSrc, 'utf8')
    } else {
      fs.rmSync(resolvedKeysFilepath, { force: true })
    }
  }

  return {
    changed,
    key,
    filepath: keysFilepath
  }
}

module.exports = removeEnvKey
