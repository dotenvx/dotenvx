const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')

const patterns = require('./precommitEnvPatterns')
const ATTRIBUTES = patterns.map(pattern => `${pattern.includes('/') ? '**/' : ''}${pattern} filter=dotenvx`)

function quote (value) {
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

function installProtectFilter () {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
  let attributesPath
  try {
    attributesPath = git('config', '--global', '--includes', '--path', '--get', 'core.attributesFile')
  } catch (error) {
    if (error.status !== 1) throw error
  }
  if (!attributesPath) {
    attributesPath = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'git/attributes')
    git('config', '--global', 'core.attributesFile', attributesPath)
  }
  const current = fs.existsSync(attributesPath) ? fs.readFileSync(attributesPath, 'utf8') : ''
  // Use the installed executable, including standalone builds. Never download a
  // replacement via npx while Git is handling secret input.
  const executable = process.pkg
    ? quote(process.execPath)
    : `${quote(process.execPath)} ${quote(path.resolve(__dirname, '../../cli/dotenvx.js'))}`

  // Git's filter_buffer_or_fd shell-quotes the filename with sq_quote_buf
  // before substituting %f (convert.c). Keep the placeholder unquoted here.
  git('config', '--global', 'filter.dotenvx.clean', `${executable} protect --git-file %f`)
  git('config', '--global', 'filter.dotenvx.required', 'true')
  fs.mkdirSync(path.dirname(attributesPath), { recursive: true })
  const existing = new Set(current.split(/\r?\n/))
  const missing = ATTRIBUTES.filter(attribute => !existing.has(attribute))
  if (missing.length > 0) {
    fs.appendFileSync(attributesPath, `${current && !current.endsWith('\n') ? '\n' : ''}${missing.join('\n')}\n`)
  }
  return attributesPath
}

module.exports = installProtectFilter
