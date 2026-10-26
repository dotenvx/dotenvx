const fs = require('fs')

// A missing file is different from an empty file or an unreadable snapshot.
async function readKeyFileSnapshot (filepath) {
  try {
    return { contents: await fs.promises.readFile(filepath) }
  } catch (error) {
    if (error.code === 'ENOENT') return { contents: null }
    throw error
  }
}

module.exports = readKeyFileSnapshot
