const LINE = /(?:^|^)\s*(?<exported>export\s+)?(?<key>[\w.-]+)(?:\s*=\s*?|:\s+?)(?<value>\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an array of objects
function parseEnv (src) {
  const objects = []

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    let { exported, key, value } = match.groups

    // Default undefined or null to empty string
    value ??= ''

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    const quote = value[0] === maybeQuote ? '' : maybeQuote

    // Expand newlines if double quoted
    if (quote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to array
    objects.push({ key, value, quote, isExported: !!exported })
  }

  return objects
}

module.exports = parseEnv
