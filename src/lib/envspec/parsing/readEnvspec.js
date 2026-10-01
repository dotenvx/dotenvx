const fs = require('node:fs')
const path = require('node:path')
const { envfile } = require('@dotenvx/primitives')
const Errors = require('../../helpers/errors')
const formatEnvspecSyntaxError = require('./formatEnvspecSyntaxError')
const resolveEnvspecPath = require('./resolveEnvspecPath')

module.exports = function readEnvspec (filepath, envFiles = ['.env']) {
  if (filepath === undefined) filepath = resolveEnvspecPath()
  let source
  try {
    source = fs.readFileSync(filepath, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    if (fs.lstatSync(filepath, { throwIfNoEntry: false })) throw new Error(`Cannot read ${path.basename(filepath)}: ${filepath}`)
    const empty = envfile.resolve(envfile.parse(''), { filepath, envFiles })
    for (const key of ['encrypted', 'redacted', 'strict', 'strictByFile']) delete empty[key]
    return { ...empty, exists: false }
  }
  let document
  try {
    document = envfile.parse(source)
  } catch (error) {
    throw new Errors({ message: formatEnvspecSyntaxError(error.cause || error, source, filepath) }).malformedEnvspec()
  }
  return envfile.resolve(document, { filepath, envFiles })
}
