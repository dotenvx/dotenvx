const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')

const ATTRIBUTE = '.env* filter=dotenvx'

function quote (value) {
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

function installPrecommitFilter (global = false) {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
  let attributesPath
  if (global) {
    try {
      attributesPath = git('config', '--global', '--includes', '--path', '--get', 'core.attributesFile')
    } catch (error) {
      if (error.status !== 1) throw error
    }
    if (!attributesPath) {
      attributesPath = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'git/attributes')
      git('config', '--global', 'core.attributesFile', attributesPath)
    }
  } else {
    attributesPath = git('rev-parse', '--git-path', 'info/attributes')
  }
  const hookPath = global ? null : git('rev-parse', '--git-path', 'hooks/pre-commit')
  const current = fs.existsSync(attributesPath) ? fs.readFileSync(attributesPath, 'utf8') : ''
  // Use the installed executable, including standalone builds. Never download a
  // replacement via npx while Git is handling secret input.
  const executable = process.pkg
    ? quote(process.execPath)
    : `${quote(process.execPath)} ${quote(path.resolve(__dirname, '../../cli/dotenvx.js'))}`

  const scope = global ? '--global' : '--local'
  // Git's filter_buffer_or_fd shell-quotes the filename with sq_quote_buf
  // before substituting %f (convert.c). Keep the placeholder unquoted here.
  git('config', scope, 'filter.dotenvx.clean', `${executable} precommit --clean %f`)
  git('config', scope, 'filter.dotenvx.required', 'true')
  fs.mkdirSync(path.dirname(attributesPath), { recursive: true })
  if (!current.split(/\r?\n/).includes(ATTRIBUTE)) {
    fs.appendFileSync(attributesPath, `${current && !current.endsWith('\n') ? '\n' : ''}${ATTRIBUTE}\n`)
  }
  if (global) return attributesPath
  fs.mkdirSync(path.dirname(hookPath), { recursive: true })
  return hookPath
}

module.exports = installPrecommitFilter
