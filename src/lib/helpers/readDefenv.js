const fs = require('node:fs')
const path = require('node:path')
const parser = require('./defenvParser')

module.exports = function readDefenv (filepath = path.resolve('Defenv')) {
  let src
  try {
    src = fs.readFileSync(filepath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return new Set()
    throw error
  }

  let declarations
  try {
    declarations = parser.parse(src)
  } catch (error) {
    const location = error.location && error.location.start
    throw new Error(`Invalid Defenv at ${filepath}${location ? `:${location.line}:${location.column}` : ''}. Expected env "NAME" or env "NAME", gateway: true/false.`)
  }

  const names = new Set()
  const gatewayKeys = new Set()
  for (const declaration of declarations) {
    if (names.has(declaration.name)) throw new Error(`Duplicate Defenv declaration: ${declaration.name}`)
    names.add(declaration.name)
    if (declaration.gateway) gatewayKeys.add(declaration.name)
  }
  return gatewayKeys
}
