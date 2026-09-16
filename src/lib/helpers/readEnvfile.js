const fs = require('node:fs')
const path = require('node:path')
const { isIP } = require('node:net')
const parser = require('./envfileParser')
const Errors = require('./errors')
const isValidUrl = require('./isValidUrl')
const isValidEmail = require('./isValidEmail')
const formatEnvfileSyntaxError = require('./formatEnvfileSyntaxError')

function compileDeclarations (declarations) {
  const proxyRules = new Map()
  const requiredKeys = []
  const types = new Map()
  const enums = new Map()
  const ranges = new Map()
  const encryptedKeys = []
  const names = new Set()
  for (const input of declarations) {
    const declaration = { ...input }
    if (names.has(declaration.name)) throw new Errors({ message: `Duplicate Envfile declaration: ${declaration.name}` }).malformedEnvfile()
    names.add(declaration.name)
    if (declaration.encrypted) encryptedKeys.push(declaration.name)
    if (declaration.type === 'port') {
      declaration.type = 'integer'
      if (declaration.min === undefined || BigInt(declaration.min) < 0n) declaration.min = '0'
      if (declaration.max === undefined || BigInt(declaration.max) > 65535n) declaration.max = '65535'
    }
    if (declaration.required) requiredKeys.push(declaration.name)
    if (declaration.type) types.set(declaration.name, declaration.type)
    if (declaration.min !== undefined || declaration.max !== undefined) {
      if (declaration.type !== 'integer') {
        throw new Errors({ message: `Invalid Envfile range for ${declaration.name}: min and max require type: "integer" or "port".` }).malformedEnvfile()
      }
      if (declaration.min !== undefined && declaration.max !== undefined && BigInt(declaration.min) > BigInt(declaration.max)) {
        throw new Errors({ message: `Invalid Envfile range for ${declaration.name}: min must be less than or equal to max.` }).malformedEnvfile()
      }
      ranges.set(declaration.name, { min: declaration.min, max: declaration.max })
    }
    if (declaration.enum) {
      if (declaration.type === 'integer' && declaration.enum.some(value => !/^[+-]?\d+$/.test(value.trim()))) {
        throw new Errors({ message: `Invalid Envfile enum for ${declaration.name}: expected integer choices.` }).malformedEnvfile()
      }
      if (declaration.type === 'boolean' && declaration.enum.some(value => !['true', 'false', '1', '0'].includes(value))) {
        throw new Errors({ message: `Invalid Envfile enum for ${declaration.name}: expected true, false, 1, or 0 choices.` }).malformedEnvfile()
      }
      if (declaration.type === 'url' && declaration.enum.some(value => !isValidUrl(value))) {
        throw new Errors({ message: `Invalid Envfile enum for ${declaration.name}: expected URL choices.` }).malformedEnvfile()
      }
      if (declaration.type === 'email' && declaration.enum.some(value => !isValidEmail(value))) {
        throw new Errors({ message: `Invalid Envfile enum for ${declaration.name}: expected email choices.` }).malformedEnvfile()
      }
      if (declaration.type === 'ip' && declaration.enum.some(value => isIP(value) === 0)) {
        throw new Errors({ message: `Invalid Envfile enum for ${declaration.name}: expected IPv4 or IPv6 choices.` }).malformedEnvfile()
      }
      enums.set(declaration.name, declaration.enum)
    }
    if (declaration.proxy) {
      const host = declaration.proxy.domain.toLowerCase()
      if (host.length > 253 || isIP(host) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
        throw new Errors({ message: `Invalid Envfile proxy host for ${declaration.name}: expected a DNS hostname without a scheme, port, path or wildcard.` }).malformedEnvfile()
      }
      proxyRules.set(declaration.name, host)
    }
  }
  return { exists: true, proxyRules, requiredKeys, types, enums, ranges, encryptedKeys }
}

module.exports = function readEnvfile (filepath = path.resolve('Envfile'), envFiles = ['.env']) {
  let src
  try {
    src = fs.readFileSync(filepath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return { ...compileDeclarations([]), exists: false }
    throw error
  }

  let document
  try {
    document = parser.parse(src)
  } catch (error) {
    throw new Errors({ message: formatEnvfileSyntaxError(error, src, filepath) }).malformedEnvfile()
  }

  const defaults = { proxy: false, required: true, encrypted: document.encrypted }
  const base = document.declarations.map(item => ({ ...defaults, ...item }))
  const baseSchema = compileDeclarations(base)
  const selected = new Set(envFiles.map(file => path.resolve(file)))
  const seen = new Set()
  const active = []
  for (const block of document.files) {
    if (/[*?[\]]/.test(block.file)) {
      throw new Errors({ message: `File blocks require an exact filename: ${block.file}` }).malformedEnvfile()
    }
    const file = path.resolve(path.dirname(filepath), block.file)
    if (seen.has(file)) throw new Errors({ message: `Duplicate Envfile file block: ${block.file}` }).malformedEnvfile()
    seen.add(file)
    const merged = new Map(base.map(item => [item.name, { ...item }]))
    if (block.encrypted !== null && block.encrypted !== undefined) {
      for (const item of merged.values()) item.encrypted = block.encrypted
    }
    const names = new Set()
    for (const item of block.declarations) {
      if (names.has(item.name)) throw new Errors({ message: `Duplicate Envfile declaration in ${block.file}: ${item.name}` }).malformedEnvfile()
      names.add(item.name)
      merged.set(item.name, {
        ...defaults,
        ...(block.encrypted === null || block.encrypted === undefined ? {} : { encrypted: block.encrypted }),
        ...merged.get(item.name),
        ...item
      })
    }
    const schema = compileDeclarations([...merged.values()])
    if (selected.has(file)) active.push(schema)
  }
  if (active.length === 0) return baseSchema

  // Each selected file policy must hold, regardless of file loading order.
  const proxyRules = new Map()
  for (const schema of active) {
    for (const [key, host] of schema.proxyRules) {
      if (proxyRules.has(key) && proxyRules.get(key) !== host) {
        throw new Errors({ message: `Conflicting Envfile proxy domains for ${key} in selected file blocks` }).malformedEnvfile()
      }
      proxyRules.set(key, host)
    }
  }
  return { ...active[0], proxyRules, schemas: active }
}
