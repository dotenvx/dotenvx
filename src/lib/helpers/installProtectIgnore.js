const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')

function installProtectIgnore () {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
  let ignorePath
  try {
    ignorePath = git('config', '--global', '--includes', '--path', '--get', 'core.excludesFile')
  } catch (error) {
    if (error.status !== 1) throw error
  }
  if (!ignorePath) {
    ignorePath = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'git/ignore')
    git('config', '--global', 'core.excludesFile', ignorePath)
  }
  const current = fs.existsSync(ignorePath) ? fs.readFileSync(ignorePath, 'utf8') : ''
  if (!current.split(/\r?\n/).includes('.env.keys*')) {
    fs.mkdirSync(path.dirname(ignorePath), { recursive: true })
    fs.appendFileSync(ignorePath, `${current && !current.endsWith('\n') ? '\n' : ''}.env.keys*\n`)
    git('config', '--global', 'dotenvx.protect.ignoreFile', ignorePath)
  }
  return ignorePath
}

module.exports = installProtectIgnore
