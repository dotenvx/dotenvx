const fs = require('fs')

const ENCODING = 'utf8'

function readFileX (filepath) {
  return fs.readFileSync(filepath, ENCODING) // always use utf8. returns string rather than buffer. if you need a buffer use fs
}

const fsx = {
  chmodSync: fs.chmodSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  appendFileSync: fs.appendFileSync,

  // fsx special commands
  readFileX
}

module.exports = fsx
