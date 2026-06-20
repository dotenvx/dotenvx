const t = require('tap')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

t.test('#--version', ct => {
  ct.equal(execShell(`${dotenvx} --version`), version)

  ct.end()
})

t.test('#--help shows armor advanced command', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.match(output, /Professional Security:/, 'professional security section is shown')
  ct.notMatch(output, /Advanced:/, 'advanced section is not shown')
  ct.match(output, /Professional Security:\s+login\s+log in to move keys off-device, share with your team, and audit access\s+logout\s+log out of connected security features\s+armor\s+⛨ move private keys off-device \[www\.dotenvx\.com\/armor\]/, 'professional security commands are ordered')
  ct.match(output, /armor\s+⛨ move private keys off-device \[www\.dotenvx\.com\/armor\]/, 'armor advanced command is shown')
  ct.notMatch(output, /ext\s+⊕ extensions/, 'ext command is not shown')
  ct.notMatch(output, /vlt\s+⛨ ARMORED KEYS/, 'vlt advanced command is not shown')
  ct.notMatch(output, /ops\s+⛨ ARMORED KEYS/, 'ops advanced command is not shown')

  ct.end()
})

t.test('#--help shows login and logout commands', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.match(output, /login\s+log in to move keys off-device, share with your\s+team, and audit access/, 'login is shown in help output')
  ct.match(output, /logout\s+log out of connected security features/, 'logout is shown in help output')

  ct.end()
})

t.test('#run --help shows no-armor and hides legacy no-ops flag', ct => {
  const output = execShell(`${dotenvx} run --help`)

  ct.match(output, /--no-armor\b/, 'no-armor is shown')
  ct.notMatch(output, /--no-ops\b/, 'no-ops is hidden')

  ct.end()
})
