const path = require('node:path')

// Match the assignment grammar used by primitives.scan, including multiline values.
function assignmentLines (src) {
  const text = (src || '').toString().replace(/\r\n?/g, '\n')
  const assignment = /^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#(.*))?$/mg
  const result = new Map()
  for (const match of text.matchAll(assignment)) {
    const start = match.index + match[0].search(/\S/)
    result.set(match[1], text.slice(0, start).split('\n').length)
  }
  return result
}

module.exports = function diagnosticLocations (processedEnvs, fallback, { environmentLabel } = {}) {
  const locations = new Map()
  for (const row of processedEnvs) {
    const filename = row.type === 'envFile' ? path.relative(process.cwd(), path.resolve(row.filepath)) : (environmentLabel || '--env')
    const lines = assignmentLines(row.src || row.string)
    for (const key of Object.keys(row.injected || {})) {
      const line = row.type === 'envFile' || !environmentLabel ? lines.get(key) : undefined
      locations.set(key, line ? `${filename}:${line}` : filename)
    }
    for (const key of Object.keys(row.existed || {})) {
      if (!locations.has(key)) locations.set(key, environmentLabel || 'shell environment')
    }
  }
  return key => locations.get(key) || fallback
}
