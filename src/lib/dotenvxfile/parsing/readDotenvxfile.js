const fs = require('node:fs')
const path = require('node:path')
const { policy } = require('@dotenvx/primitives')
const resolveDotenvxfilePath = require('./resolveDotenvxfilePath')
const formatDotenvxfileSyntaxError = require('./formatDotenvxfileSyntaxError')

function readSource (filepath = resolveDotenvxfilePath()) {
  try {
    return { source: fs.readFileSync(filepath, 'utf8'), filepath, exists: true }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return { filepath, exists: false }
  }
}

function readDotenvxfile (filepath, files = ['.env']) {
  const document = readSource(filepath)
  if (!document.exists) return { keys: {}, exists: false }
  // File paths arrive relative to the caller; file blocks are relative to Dotenvxfile.
  const selected = files.flatMap(file => {
    const absolute = path.resolve(file)
    return [path.relative(path.dirname(document.filepath), absolute), absolute]
  }).join(',')
  try {
    return { ...policy(document.source, selected), filepath: document.filepath, exists: true }
  } catch (error) {
    formatError(error, document)
    throw error
  }
}

module.exports = readDotenvxfile
module.exports.source = readSource

function formatError (error, document) {
  if (error.location) {
    error.message = `[${error.code}] ${formatDotenvxfileSyntaxError(error.cause || error, document.source, document.filepath)}`
    error.messageWithHelp = error.message
  }
  return error
}
module.exports.formatError = formatError
