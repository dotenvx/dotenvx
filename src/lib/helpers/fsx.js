const fs = require('fs')

const filesystem = {
  chmodSync: fs.chmodSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  appendFileSync: fs.appendFileSync
}

module.exports = filesystem
