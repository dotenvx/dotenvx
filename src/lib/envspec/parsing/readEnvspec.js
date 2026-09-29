const fs = require('node:fs')
const path = require('node:path')
const { isIP } = require('node:net')
const parser = require('./envspecParser')
const Errors = require('../../helpers/errors')
const isValidUrl = require('../../helpers/isValidUrl')
const isValidEmail = require('../../helpers/isValidEmail')
const formatEnvspecSyntaxError = require('./formatEnvspecSyntaxError')

function compileDeclarations (declarations) {
  const proxyRules = new Map()
  const requiredKeys = []
  const types = new Map()
  const enums = new Map()
  const ranges = new Map()
  const encryptedKeys = []
  const redactionRules = new Map()
  const encryptionRules = new Map()
  const names = new Set()
  for (const input of declarations) {
    const declaration = { ...input }
    if (names.has(declaration.name)) throw new Errors({ message: `Duplicate Envspec declaration: ${declaration.name}` }).malformedEnvspec()
    names.add(declaration.name)
    redactionRules.set(declaration.name, declaration.redacted !== false)
    encryptionRules.set(declaration.name, declaration.encrypted !== false)
    if (declaration.encrypted !== false) encryptedKeys.push(declaration.name)
    if (declaration.type === 'port') {
      declaration.type = 'integer'
      if (declaration.min === undefined || BigInt(declaration.min) < 0n) declaration.min = '0'
      if (declaration.max === undefined || BigInt(declaration.max) > 65535n) declaration.max = '65535'
    }
    if (declaration.required) requiredKeys.push(declaration.name)
    if (declaration.type) types.set(declaration.name, declaration.type)
    if (declaration.min !== undefined || declaration.max !== undefined) {
      if (declaration.type !== 'integer') {
        throw new Errors({ message: `Invalid Envspec range for ${declaration.name}: min and max require type: "integer" or "port".` }).malformedEnvspec()
      }
      if (declaration.min !== undefined && declaration.max !== undefined && BigInt(declaration.min) > BigInt(declaration.max)) {
        throw new Errors({ message: `Invalid Envspec range for ${declaration.name}: min must be less than or equal to max.` }).malformedEnvspec()
      }
      ranges.set(declaration.name, { min: declaration.min, max: declaration.max })
    }
    if (declaration.enum) {
      if (declaration.type === 'integer' && declaration.enum.some(value => !/^[+-]?\d+$/.test(value.trim()))) {
        throw new Errors({ message: `Invalid Envspec enum for ${declaration.name}: expected integer choices.` }).malformedEnvspec()
      }
      if (declaration.type === 'boolean' && declaration.enum.some(value => !['true', 'false', '1', '0'].includes(value))) {
        throw new Errors({ message: `Invalid Envspec enum for ${declaration.name}: expected true, false, 1, or 0 choices.` }).malformedEnvspec()
      }
      if (declaration.type === 'url' && declaration.enum.some(value => !isValidUrl(value))) {
        throw new Errors({ message: `Invalid Envspec enum for ${declaration.name}: expected URL choices.` }).malformedEnvspec()
      }
      if (declaration.type === 'email' && declaration.enum.some(value => !isValidEmail(value))) {
        throw new Errors({ message: `Invalid Envspec enum for ${declaration.name}: expected email choices.` }).malformedEnvspec()
      }
      if (declaration.type === 'ip' && declaration.enum.some(value => isIP(value) === 0)) {
        throw new Errors({ message: `Invalid Envspec enum for ${declaration.name}: expected IPv4 or IPv6 choices.` }).malformedEnvspec()
      }
      enums.set(declaration.name, declaration.enum)
    }
    if (declaration.proxy) {
      const host = declaration.proxy.domain.toLowerCase()
      if (host.length > 253 || isIP(host) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
        throw new Errors({ message: `Invalid Envspec proxy host for ${declaration.name}: expected a DNS hostname without a scheme, port, path or wildcard.` }).malformedEnvspec()
      }
      proxyRules.set(declaration.name, host)
    }
  }
  return { exists: true, proxyRules, requiredKeys, types, enums, ranges, encryptedKeys, redactionRules, encryptionRules }
}

module.exports = function readEnvspec (filepath = path.resolve('Envspec'), envFiles = ['.env']) {
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
    throw new Errors({ message: formatEnvspecSyntaxError(error, src, filepath) }).malformedEnvspec()
  }

  const defaults = { proxy: false, required: true, encrypted: true, redacted: true }
  const base = document.declarations.map(item => ({ ...defaults, ...item }))
  const baseSchema = { ...compileDeclarations(base), encrypted: true, redacted: true }
  const selected = new Set(envFiles.map(file => path.resolve(file)))
  const seen = new Set()
  const active = []
  for (const block of document.files) {
    if (/[*?[\]]/.test(block.file)) {
      throw new Errors({ message: `File blocks require an exact filename: ${block.file}` }).malformedEnvspec()
    }
    const file = path.resolve(path.dirname(filepath), block.file)
    if (seen.has(file)) throw new Errors({ message: `Duplicate Envspec file block: ${block.file}` }).malformedEnvspec()
    seen.add(file)
    const merged = new Map(base.map(item => [item.name, { ...item }]))
    const names = new Set()
    for (const item of block.declarations) {
      if (names.has(item.name)) throw new Errors({ message: `Duplicate Envspec declaration in ${block.file}: ${item.name}` }).malformedEnvspec()
      names.add(item.name)
      merged.set(item.name, {
        ...defaults,
        ...merged.get(item.name),
        ...item
      })
    }
    const schema = { ...compileDeclarations([...merged.values()]), encrypted: true, redacted: true }
    if (selected.has(file)) active.push(schema)
  }
  if (active.length === 0) return baseSchema

  // Each selected file policy must hold, regardless of file loading order.
  const proxyRules = new Map()
  for (const schema of active) {
    for (const [key, host] of schema.proxyRules) {
      if (proxyRules.has(key) && proxyRules.get(key) !== host) {
        throw new Errors({ message: `Conflicting Envspec proxy domains for ${key} in selected file blocks` }).malformedEnvspec()
      }
      proxyRules.set(key, host)
    }
  }
  const redactionRules = new Map()
  for (const schema of active) {
    for (const [name, redacted] of schema.redactionRules) {
      redactionRules.set(name, redactionRules.get(name) === true || redacted)
    }
  }
  return { ...active[0], redactionRules, proxyRules, schemas: active }
}
