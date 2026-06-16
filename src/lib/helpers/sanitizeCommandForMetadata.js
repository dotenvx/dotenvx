function commandParts (command) {
  if (Array.isArray(command)) {
    return command.map(arg => `${arg}`)
  }

  const parts = []
  const src = `${command}`
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\S+)/g
  let match

  while ((match = regex.exec(src)) !== null) {
    parts.push(match[1] || match[2] || match[3])
  }

  return parts
}

function flagName (part) {
  if (!part.startsWith('--')) return null
  return part.slice(2).split('=')[0].toLowerCase()
}

function isSecretFlag (part) {
  const name = flagName(part)
  if (!name) return false
  if (name === 'pass' || name === 'password' || name === 'passphrase' || name === 'pwd') return true

  return name.includes('token') ||
    name.includes('password') ||
    name.includes('secret') ||
    name.includes('api-key') ||
    name.includes('apikey') ||
    name.includes('private-key')
}

function sanitizeCommandForMetadata (command) {
  const parts = commandParts(command)
  const sanitized = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (isSecretFlag(part) && part.includes('=')) {
      const name = part.split('=')[0]
      sanitized.push(`${name}=[REDACTED]`)
      continue
    }

    if (isSecretFlag(part)) {
      sanitized.push(part)
      if (i + 1 < parts.length) {
        sanitized.push('[REDACTED]')
        i++
      }
      continue
    }

    sanitized.push(part)
  }

  return sanitized.join(' ')
}

module.exports = sanitizeCommandForMetadata
