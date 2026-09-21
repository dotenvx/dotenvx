const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { HOOK_SCRIPT } = require('./installPrecommitHook')

const LEGACY_SCRIPT = `#!/bin/sh

if command -v dotenvx 2>&1 >/dev/null
then
  dotenvx ext precommit
elif npx dotenvx -V >/dev/null 2>&1
then
  npx dotenvx ext precommit
else
  echo "[dotenvx][precommit] 'dotenvx' command not found"
  echo "[dotenvx][precommit] ? install it with [curl -fsS https://dotenvx.sh | sh]"
  echo "[dotenvx][precommit] ? other install options [https://dotenvx.com/docs/install]"
  exit 1
fi
`

function within (directory, file) {
  const relative = path.relative(directory, file)
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)
}

function uninstallPrecommitHook (directory = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  let root
  try {
    root = git('rev-parse', '--show-toplevel')
  } catch (error) {
    if (error.status === 128) return { removed: false }
    throw error
  }
  const hookPath = path.resolve(directory, git('rev-parse', '--git-path', 'hooks/pre-commit'))
  const commonDir = path.resolve(directory, git('rev-parse', '--git-common-dir'))
  const manual = () => ({ removed: false, warning: `pre-commit hook left unchanged; remove its dotenvx precommit entry manually [${hookPath}]` })
  let stat
  try {
    stat = fs.lstatSync(hookPath)
  } catch (error) {
    if (error.code === 'ENOENT') return { removed: false }
    throw error
  }
  // Never modify symlinked hooks or shared hooks outside this repository.
  if (!stat.isFile() || (!within(root, fs.realpathSync(hookPath)) && !within(commonDir, fs.realpathSync(hookPath)))) return manual()
  const source = fs.readFileSync(hookPath, 'utf8')
  const templates = [HOOK_SCRIPT, LEGACY_SCRIPT, HOOK_SCRIPT.replaceAll('dotenvx precommit', 'dotenvx ext precommit'), LEGACY_SCRIPT.replaceAll('dotenvx ext precommit', 'dotenvx precommit')]
  let next = source
  for (const template of templates) {
    for (const block of [template, template.replaceAll('\n', '\r\n')]) {
      // Match whole, known installer blocks; do not guess at shell structure.
      const escaped = block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      next = next.replace(new RegExp('(^|\\n)' + escaped, 'g'), '$1')
    }
  }
  if (next === source) {
    return /dotenvx\s+(?:ext\s+)?precommit/.test(source) ? manual() : { removed: false }
  }
  if (next.trim() === '') fs.unlinkSync(hookPath)
  else fs.writeFileSync(hookPath, next, 'utf8')
  return { removed: true, warning: /dotenvx\s+(?:ext\s+)?precommit/.test(next) ? manual().warning : undefined }
}

module.exports = uninstallPrecommitHook
