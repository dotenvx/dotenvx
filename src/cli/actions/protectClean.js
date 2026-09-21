const fs = require('fs')
const path = require('path')
const { sealed } = require('@dotenvx/primitives')

function protectClean (filepath) {
  try {
    const content = fs.readFileSync(0)
    const filename = path.posix.basename(filepath)
    const exempt = ['.env.example', '.env.vault', '.env.x'].includes(filename)
    if (filename.startsWith('.env.keys') || (!exempt && !sealed(content.toString('utf8')))) {
      throw new Error(`refusing to stage ${JSON.stringify(filepath)}: encrypt this env file or add it to .gitignore`)
    }
    // stdout is Git's blob content: no logging, normalization, or extra newline.
    process.stdout.write(content)
  } catch (error) {
    process.stderr.write(`dotenvx: ${error.message}\n`)
    process.exitCode = 1
  }
}

module.exports = protectClean
