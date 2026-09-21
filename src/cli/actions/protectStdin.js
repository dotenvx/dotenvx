const fs = require('fs')
const path = require('path')
const { sealed } = require('@dotenvx/primitives')
const { logger } = require('../../shared/logger')

function fixMessage (filepath, privateKeyFile) {
  if (Array.from(filepath).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
    return privateKeyFile ? 'fix: add this private-key file to .gitignore' : 'fix: encrypt this env file or add it to .gitignore'
  }
  const argument = /^[a-zA-Z0-9_./-]+$/.test(filepath) ? filepath : "'" + filepath.replace(/'/g, "'\\''") + "'"
  return privateKeyFile
    ? `fix: run [dotenvx gitignore --pattern ${argument}]`
    : `fix: run [dotenvx encrypt -f ${argument}]`
}

function check (filepath, content) {
  const filename = path.posix.basename(filepath)
  const exempt = ['.env.example', '.env.vault', '.env.x'].includes(filename)
  const privateKeyFile = filename.startsWith('.env.keys')
  if (privateKeyFile || (!exempt && !sealed(content.toString('utf8')))) {
    const code = privateKeyFile ? 'PRIVATE_KEY_FILE' : 'PLAINTEXT_ENV'
    const fix = fixMessage(filepath, privateKeyFile)
    const message = privateKeyFile
      ? `refusing to stage ${JSON.stringify(filepath)}`
      : `${JSON.stringify(filepath)} contains plaintext secrets`
    logger.error(`[${code}] ${message}. ${fix}`)
    return false
  }
  return true
}

function protectStdin (filepath) {
  try {
    const content = fs.readFileSync(0)
    if (!check(filepath, content)) {
      process.exitCode = 1
      return
    }
    // stdout is Git's blob content: no logging, normalization, or extra newline.
    process.stdout.write(content)
  } catch (error) {
    logger.error(error.message)
    process.exitCode = 1
  }
}

module.exports = protectStdin
module.exports.check = check
