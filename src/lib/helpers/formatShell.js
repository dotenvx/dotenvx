function formatShell (parsed) {
  const pairs = []

  for (const [key, value] of Object.entries(parsed)) {
    const formattedValue = String(value)

    if (/[ \t\r\n]/.test(formattedValue)) {
      throw new Error(`cannot format ${key} as shell: value contains whitespace. Use --format=eval with eval instead.`)
    }

    pairs.push(`${key}=${formattedValue}`)
  }

  return pairs.join(' ')
}

module.exports = formatShell
