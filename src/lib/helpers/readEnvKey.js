const fs = require('fs')
const { scan } = require('@dotenvx/primitives')
const Errors = require('./errors')

function ignored (error, options) {
  return (options.ignore || []).includes(error.code)
}

function readEnvKey (key, filepath, options = {}) {
  let src
  try {
    src = fs.readFileSync(filepath)
  } catch (_error) {
    const error = new Errors({ envFilepath: filepath }).missingEnvFile()
    if (ignored(error, options)) return undefined
    if (options.strict) throw error
    return undefined
  }

  const { parsed } = scan(src)
  const values = parsed[key]
  const value = values ? values[values.length - 1] : undefined
  if (value === undefined) {
    const error = new Errors({ key }).missingKey()
    if (ignored(error, options)) return undefined
    if (options.strict) throw error
  }

  return value
}

module.exports = readEnvKey
