const path = require('node:path')

module.exports = function formatEnvfileSyntaxError (error, src, filepath) {
  const location = error.location?.start
  if (!location) return error.message

  const filename = path.relative(process.cwd(), filepath) || path.basename(filepath)
  const line = src.split(/\r\n|\n|\r/)[location.line - 1] || ''
  let message = error.message
  if (error.expected) {
    const remaining = src.slice(location.offset)
    const token = remaining.match(/^(?:"[^"\r\n]*"|'[^'\r\n]*'|[A-Za-z0-9_]+|[^\r\n])/u)?.[0]
    const displayToken = token && /^["']/.test(token) ? token : JSON.stringify(token)
    message = token ? `Unexpected ${displayToken}` : 'Unexpected end of input'
    const expected = [...new Set(error.expected.flatMap(item => {
      if (item.type === 'other') return [item.description]
      if (item.type === 'literal' && item.text.trim() && item.text !== '#') return [JSON.stringify(item.text)]
      return []
    }))]
    if (expected.length > 0 && expected.length <= 3) message += `; expected ${expected.join(' or ')}`
  }
  const prefix = `${location.line} | `
  return `${filename}:${location.line}:${location.column}: ${message}\n${prefix}${line}\n${' '.repeat(prefix.length)}${line.slice(0, location.column - 1).replace(/[^\t]/g, ' ')}^`
}
