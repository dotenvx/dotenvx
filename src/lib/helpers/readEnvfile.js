const fs = require('node:fs')
const path = require('node:path')
const { isIP } = require('node:net')
const parser = require('./envfileParser')

module.exports = function readEnvfile (filepath = path.resolve('Envfile')) {
  const proxyRules = new Map()
  const requiredKeys = []
  const types = new Map()
  const enums = new Map()
  const ranges = new Map()
  let src
  try {
    src = fs.readFileSync(filepath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, proxyRules, requiredKeys, types, enums, ranges }
    throw error
  }

  let declarations
  try {
    declarations = parser.parse(src)
  } catch (error) {
    const location = error.location && error.location.start
    throw new Error(`Invalid Envfile at ${filepath}${location ? `:${location.line}:${location.column}` : ''}. Expected env "NAME" with required: true (or false) or optional: true (or false), type: "integer" (or "boolean"), enum: ["value", ...], min: 0, max: 65535, and proxy: { domain: "api.example.com" } (or false).`)
  }

  const names = new Set()
  for (const declaration of declarations) {
    if (names.has(declaration.name)) throw new Error(`Duplicate Envfile declaration: ${declaration.name}`)
    names.add(declaration.name)
    if (declaration.required) requiredKeys.push(declaration.name)
    if (declaration.type) types.set(declaration.name, declaration.type)
    if (declaration.min !== undefined || declaration.max !== undefined) {
      if (declaration.type !== 'integer') {
        throw new Error(`Invalid Envfile range for ${declaration.name}: min and max require type: "integer".`)
      }
      if (declaration.min !== undefined && declaration.max !== undefined && BigInt(declaration.min) > BigInt(declaration.max)) {
        throw new Error(`Invalid Envfile range for ${declaration.name}: min must be less than or equal to max.`)
      }
      ranges.set(declaration.name, { min: declaration.min, max: declaration.max })
    }
    if (declaration.enum) {
      if (declaration.type === 'integer' && declaration.enum.some(value => !/^[+-]?\d+$/.test(value.trim()))) {
        throw new Error(`Invalid Envfile enum for ${declaration.name}: expected integer choices.`)
      }
      if (declaration.type === 'boolean' && declaration.enum.some(value => !['true', 'false', '1', '0'].includes(value))) {
        throw new Error(`Invalid Envfile enum for ${declaration.name}: expected true, false, 1, or 0 choices.`)
      }
      enums.set(declaration.name, declaration.enum)
    }
    if (declaration.proxy) {
      const host = declaration.proxy.domain.toLowerCase()
      if (host.length > 253 || isIP(host) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
        throw new Error(`Invalid Envfile proxy host for ${declaration.name}: expected a DNS hostname without a scheme, port, path or wildcard.`)
      }
      proxyRules.set(declaration.name, host)
    }
  }
  return { exists: true, proxyRules, requiredKeys, types, enums, ranges }
}
