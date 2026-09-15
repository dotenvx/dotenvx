const fs = require('node:fs')
const path = require('node:path')
const { isIP } = require('node:net')
const parser = require('./envfileParser')

module.exports = function readEnvfile (filepath = path.resolve('Envfile')) {
  let src
  try {
    src = fs.readFileSync(filepath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }

  let declarations
  try {
    declarations = parser.parse(src)
  } catch (error) {
    const location = error.location && error.location.start
    throw new Error(`Invalid Envfile at ${filepath}${location ? `:${location.line}:${location.column}` : ''}. Expected env "NAME" or env "NAME", proxy: { domain: "api.example.com" } (or false).`)
  }

  const names = new Set()
  const proxyRules = new Map()
  for (const declaration of declarations) {
    if (names.has(declaration.name)) throw new Error(`Duplicate Envfile declaration: ${declaration.name}`)
    names.add(declaration.name)
    if (declaration.proxy) {
      const host = declaration.proxy.domain.toLowerCase()
      if (host.length > 253 || isIP(host) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) {
        throw new Error(`Invalid Envfile proxy host for ${declaration.name}: expected a DNS hostname without a scheme, port, path or wildcard.`)
      }
      proxyRules.set(declaration.name, host)
    }
  }
  return proxyRules
}
