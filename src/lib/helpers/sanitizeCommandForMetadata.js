function sanitizeCommandForMetadata (command) {
  const parts = Array.isArray(command) ? command.map(arg => `${arg}`) : `${command}`.split(' ')
  const sanitized = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part === '--token') {
      sanitized.push(part)
      if (i + 1 < parts.length) {
        sanitized.push('[REDACTED]')
        i++
      }
      continue
    }

    if (part.startsWith('--token=')) {
      sanitized.push('--token=[REDACTED]')
      continue
    }

    sanitized.push(part)
  }

  return sanitized.join(' ')
}

module.exports = sanitizeCommandForMetadata
