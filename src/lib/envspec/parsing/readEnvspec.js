const fs = require('node:fs')
const path = require('node:path')
const { parseenvfile } = require('@dotenvx/primitives')
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
    const empty = parseenvfile('', { filepath, envFiles })
    for (const key of ['encrypted', 'redacted', 'strict', 'strictByFile']) delete empty[key]
    return { ...empty, exists: false }
  }
  try {
    return parseenvfile(source, { filepath, envFiles })
  } catch (error) {
    if (!error.cause) throw error
    throw new Errors({ message: formatEnvspecSyntaxError(error.cause, source, filepath) }).malformedEnvspec()
  }
}
