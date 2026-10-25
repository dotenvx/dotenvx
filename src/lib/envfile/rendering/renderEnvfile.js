function declaration (item) {
  let line = `env "${item.name}"`
  if (item.type) line += `, type: "${item.type}"`
  if (item.redacted !== undefined) line += `, redacted: ${item.redacted}`
  if (item.encrypted !== undefined) line += `, encrypted: ${JSON.stringify(item.encrypted)}`
  if (item.optional !== undefined) line += `, optional: ${item.optional}`
  return line
}

function renderFile (file) {
  const quote = file.filename.includes('"') ? "'" : '"'
  if (file.filename.includes(quote) || /[\r\n\0*?[\]{}]/.test(file.filename)) {
    throw new Error(`Unsupported Envarmor filename: ${file.filename}`)
  }
  const lines = [`file ${quote}${file.filename}${quote} do`]
  lines.push(...file.declarations.map(item => `  ${declaration(item)}`), 'end')
  return lines.join('\n')
}

module.exports = function renderEnvfile (document) {
  const sections = ['strict false       # halt on validation failures\nredacted false     # hide values in stdout/stderr. recommended: true\nencrypted false    # encrypt values in files. recommended: true']
  if (document.declarations.length) sections.push(document.declarations.map(declaration).join('\n'))
  for (const proxy of document.proxies || []) sections.push(`proxy "${proxy.host}", bearer: "${proxy.key}"`)
  for (const file of document.files) {
    sections.push(renderFile(file))
  }
  if (document.codeDeclarations.length) {
    sections.push('# additionally found in code\n' + document.codeDeclarations.map(declaration).join('\n'))
  }
  return '# Envarmor (safe to commit)\n' + sections.join('\n\n') + '\n'
}
