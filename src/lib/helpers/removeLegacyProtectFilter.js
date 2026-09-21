const path = require('path')
const fs = require('fs')
const patterns = require('./precommitEnvPatterns')
const { execFileSync } = require('child_process')

function isLegacy (command) {
  const tokens = command.match(/'[^']*'|"[^"]*"|[^\s'";&|`$<>]+/g) || []
  if (tokens.join(' ') !== command.trim()) return false
  const args = tokens.map(token => /^['"]/.test(token) ? token.slice(1, -1) : token)
  if (args.slice(-3).join(' ') !== 'precommit --clean %f') return false
  const executable = args.slice(0, -3)
  return (executable.length === 1 && path.basename(executable[0]) === 'dotenvx') ||
    (executable.length === 2 && ['node', 'node.exe'].includes(path.basename(executable[0])) && path.basename(executable[1]) === 'dotenvx.js')
}

function removeLegacyProtectFilter (directory = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  let commands
  try {
    commands = git('config', '--local', '--get-all', 'filter.dotenvx.clean').split('\n')
  } catch (error) {
    if (error.status === 128) return
    if (error.status !== 1) throw error
    commands = []
  }
  // Only remove an entirely recognized legacy registration, never custom shell commands.
  if (!commands.every(isLegacy)) return
  if (commands.length) git('config', '--local', '--unset-all', 'filter.dotenvx.clean')
  try {
    if (commands.length) git('config', '--local', '--fixed-value', '--unset-all', 'filter.dotenvx.required', 'true')
  } catch (error) {
    if (error.status !== 5) throw error
  }
  const attributesPath = path.resolve(directory, git('rev-parse', '--git-path', 'info/attributes'))
  if (!fs.existsSync(attributesPath) || fs.lstatSync(attributesPath).isSymbolicLink()) return
  const oldRules = patterns.map(pattern => `${pattern.includes('/') ? '**/' : ''}${pattern} filter=dotenvx`)
  const source = fs.readFileSync(attributesPath, 'utf8')
  const updated = source.split(/(?<=\n)/).map(line => oldRules.includes(line.replace(/\r?\n$/, '')) ? line.replace('filter=dotenvx', 'filter=dotenvx.protect') : line).join('')
  if (updated !== source) fs.writeFileSync(attributesPath, updated)
}

module.exports = removeLegacyProtectFilter
