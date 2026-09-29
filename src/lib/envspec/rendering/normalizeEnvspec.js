// Pure final pass over independently inferred file rules. Never mutates inputs.
module.exports = function normalizeEnvspec ({ files, codeDeclarations = [] }) {
  const hasNamedEnvironment = files.some(file => !['.env', '.env.example'].includes(file.filename))
  const rootFiles = []
  const environments = []
  for (const file of files) {
    if (!file.suggestCommit && (file.filename === '.env.example' || (file.filename === '.env' && !hasNamedEnvironment))) rootFiles.push(file)
    else environments.push(file)
  }

  const encrypted = files.some(file => file.encrypted)
  const root = new Map()
  for (const file of rootFiles) {
    for (const item of file.declarations) {
      const previous = root.get(item.name)
      root.set(item.name, { ...item, encrypted: Boolean(previous?.encrypted || item.encrypted) })
    }
  }

  if (environments.length > 1) {
    for (const item of environments[0].declarations) {
      const matches = environments.map(file => file.declarations.find(other => other.name === item.name))
      if (!root.has(item.name) && matches.every(other => other && other.type === item.type && other.optional === item.optional)) {
        // Keep encryption differences in their file scopes, not the shared declaration.
        root.set(item.name, { ...item, encrypted })
      }
    }
  }

  const blocks = environments.map(file => {
    const overridesEncryption = file.encrypted !== encrypted
    const declarations = file.declarations.flatMap(item => {
      const inherited = root.get(item.name)
      const defaults = inherited
        ? { ...inherited, encrypted: overridesEncryption ? file.encrypted : inherited.encrypted }
        : { encrypted: file.encrypted }
      const overrides = Object.fromEntries(Object.entries(item).filter(([key, value]) => key !== 'name' && value !== defaults[key]))
      return inherited && !Object.keys(overrides).length ? [] : [{ name: item.name, ...overrides }]
    })
    return { filename: file.filename, ...(file.suggestCommit ? { suggestCommit: true } : {}), ...(overridesEncryption ? { encrypted: file.encrypted } : {}), declarations }
  })

  const names = new Set(files.flatMap(file => file.declarations.map(item => item.name)))
  const code = []
  for (const item of codeDeclarations) {
    if (names.has(item.name)) continue
    names.add(item.name)
    code.push({ ...item, optional: true })
  }
  const declarations = [...root.values()].map(item => {
    const result = { ...item }
    if (result.encrypted === encrypted) delete result.encrypted
    return result
  })
  return { encrypted, redacted: true, declarations, files: blocks, codeDeclarations: code }
}
