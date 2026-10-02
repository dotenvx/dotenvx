const fs = require('node:fs')
const path = require('node:path')
const { parseenvfile } = require('@dotenvx/primitives')
const Errors = require('../../helpers/errors')
const formatEnvfileSyntaxError = require('./formatEnvfileSyntaxError')
const resolveEnvfilePath = require('./resolveEnvfilePath')

module.exports = function readEnvfile (filepath, envFiles = ['.env']) {
  if (filepath === undefined) filepath = resolveEnvfilePath()
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
    throw new Errors({ message: formatEnvfileSyntaxError(error.cause, source, filepath) }).malformedEnvfile()
  }
}
