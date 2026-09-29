const fs = require('fs')
const path = require('path')
const plaintextKeys = require('../../lib/helpers/plaintextKeys')
const protectEnvspec = require('../../lib/envspec/validation/protectEnvspec')
const { logger } = require('../../shared/logger')
const createProtectSpinner = require('../../lib/helpers/createProtectSpinner')
const logProtectedFiles = require('../../lib/helpers/logProtectedFiles')

function exempt (filepath) {
  return ['.env.example', '.env.vault', '.env.x'].includes(path.posix.basename(filepath))
}

function fixMessage (filepath, privateKeyFile) {
  if (Array.from(filepath).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
    return privateKeyFile ? 'fix: add this private-key file to .gitignore' : 'fix: encrypt this env file or add it to .gitignore'
  }
  const argument = /^[a-zA-Z0-9_./-]+$/.test(filepath) ? filepath : "'" + filepath.replace(/'/g, "'\\''") + "'"
  return privateKeyFile
    ? `fix: run [dotenvx gitignore --pattern ${argument}]`
    : `fix: run [dotenvx encrypt -f ${argument}]`
}

function check (filepath, content, beforeError = () => {}) {
  const filename = path.posix.basename(filepath)
  const privateKeyFile = filename.startsWith('.env.keys')
  let rejected = null
  let policy
  if (!privateKeyFile) {
    try {
      policy = protectEnvspec(filepath, content.toString('utf8'))
      rejected = policy?.rejected ?? null
    } catch (error) {
      beforeError()
      logger.error(error.message)
      return false
    }
  }
  const plaintext = rejected === null
    ? !exempt(filepath) && plaintextKeys(content.toString('utf8')).length > 0
    : rejected.length > 0
  if (privateKeyFile || plaintext) {
    const code = privateKeyFile ? 'PRIVATE_KEY_FILE' : 'PLAINTEXT_ENV'
    const fix = policy?.commitRequired
      ? 'fix: add [commit true] to Envspec'
      : fixMessage(filepath, privateKeyFile)
    const message = privateKeyFile
      ? `refusing to stage ${JSON.stringify(filepath)}`
      : policy?.commitRequired
        ? `${JSON.stringify(filepath)} contains permitted plaintext but lacks commit true`
        : rejected?.length
          ? `${rejected.join(', ')} not encrypted (${JSON.stringify(filepath)})`
          : `${JSON.stringify(filepath)} contains plaintext secrets`
    beforeError()
    logger.error(`[${code}] ${message}. ${fix}`)
    return false
  }
  return true
}

async function protectStdin (filepath, options = {}) {
  let spinner
  const stop = () => { if (spinner) spinner.stop() }
  try {
    spinner = await createProtectSpinner(options)
    const content = fs.readFileSync(0)
    if (!check(filepath, content, stop)) {
      process.exitCode = 1
      return
    }
    // stdout is Git's blob content: no logging, normalization, or extra newline.
    process.stdout.write(content)
    stop()
    if (spinner && !exempt(filepath)) logProtectedFiles([filepath])
  } catch (error) {
    stop()
    logger.error(error.message)
    process.exitCode = 1
    return { error }
  } finally {
    stop()
  }
}

module.exports = protectStdin
module.exports.check = check
module.exports.exempt = exempt
