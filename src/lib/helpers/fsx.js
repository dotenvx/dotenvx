const fs = require('fs')

const ENCODING = 'utf8'

async function readFileX (filepath, encoding = null) {
  if (!encoding) {
    encoding = ENCODING
  }

  return fs.promises.readFile(filepath, encoding)
}

function readFileXSync (filepath, encoding = null) {
  if (!encoding) {
    encoding = ENCODING
  }

  return fs.readFileSync(filepath, encoding) // utf8 default so it returns a string
}

function writeFileXSync (filepath, str) {
  return fs.writeFileSync(filepath, str, ENCODING) // utf8 always
}

async function writeFileX (filepath, str) {
  return fs.promises.writeFile(filepath, str, ENCODING)
}

async function exists (filepath) {
  try {
    await fs.promises.access(filepath)
    return true
  } catch (_e) {
    return false
  }
}

const fsx = {
  chmodSync: fs.chmodSync,
  exists,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  appendFileSync: fs.appendFileSync,

  // fsx special commands
  readFileX,
  readFileXSync,
  writeFileX,
  writeFileXSync
}

module.exports = fsx
