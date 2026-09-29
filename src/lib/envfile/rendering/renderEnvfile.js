function declaration (item) {
  let line = `env "${item.name}"`
  if (item.type) line += `, type: "${item.type}"`
  if (item.encrypted !== undefined) line += `, encrypted: ${item.encrypted}`
  if (item.redacted !== undefined) line += `, redacted: ${item.redacted}`
  if (item.optional !== undefined) line += `, optional: ${item.optional}`
  return line
}

module.exports = function renderEnvfile (document) {
  const sections = [`redacted ${document.redacted ?? true}\nencrypted ${document.encrypted}`]
  if (document.declarations.length) sections.push(document.declarations.map(declaration).join('\n'))
  for (const file of document.files) {
    const quote = file.filename.includes('"') ? "'" : '"'
    if (file.filename.includes(quote) || /[\r\n\0*?[\]{}]/.test(file.filename)) {
      throw new Error(`Unsupported Envfile filename: ${file.filename}`)
    }
    const lines = [`file ${quote}${file.filename}${quote} do`]
    if (file.encrypted !== undefined) lines.push(`  encrypted ${file.encrypted}`)
    lines.push(...file.declarations.map(item => `  ${declaration(item)}`), 'end')
    sections.push(lines.join('\n'))
  }
  if (document.codeDeclarations.length) {
    sections.push('# additionally found in code\n' + document.codeDeclarations.map(declaration).join('\n'))
  }
  return sections.join('\n\n') + '\n'
}
