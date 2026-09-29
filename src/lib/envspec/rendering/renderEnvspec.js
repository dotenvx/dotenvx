function declaration (item) {
  let line = `env "${item.name}"`
  if (item.type) line += `, type: "${item.type}"`
  if (item.encrypted !== undefined) line += `, encrypted: ${item.encrypted}`
  if (item.redacted !== undefined) line += `, redacted: ${item.redacted}`
  if (item.optional !== undefined) line += `, optional: ${item.optional}`
  return line
}

function renderFile (file) {
  const quote = file.filename.includes('"') ? "'" : '"'
  if (file.filename.includes(quote) || /[\r\n\0*?[\]{}]/.test(file.filename)) {
    throw new Error(`Unsupported Envspec filename: ${file.filename}`)
  }
  const lines = [`file ${quote}${file.filename}${quote} do`]
  lines.push(...file.declarations.map(item => `  ${declaration(item)}`), 'end')
  return lines.join('\n')
}

module.exports = function renderEnvspec (document) {
  const sections = []
  if (document.declarations.length) sections.push(document.declarations.map(declaration).join('\n'))
  for (const file of document.files) {
    sections.push(renderFile(file))
  }
  if (document.codeDeclarations.length) {
    sections.push('# additionally found in code\n' + document.codeDeclarations.map(declaration).join('\n'))
  }
  return '# Envspec (safe to commit)\n# ------------------------\n\n' + sections.join('\n\n') + (sections.length ? '\n' : '')
}
