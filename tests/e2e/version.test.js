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

  ct.match(output, /armor\s+⛨ ARMORED KEYS \[www\.dotenvx\.com\/armor\]/, 'armor advanced command is shown')
  ct.notMatch(output, /vlt\s+⛨ ARMORED KEYS/, 'vlt advanced command is not shown')
  ct.notMatch(output, /ops\s+⛨ ARMORED KEYS/, 'ops advanced command is not shown')

  ct.end()
})

t.test('#--help hides login command', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.notMatch(output, /\blogin\b/, 'login is hidden from help output')

  ct.end()
})

t.test('#run --help shows no-armor and hides legacy no-vlt/no-ops flags', ct => {
  const output = execShell(`${dotenvx} run --help`)

  ct.match(output, /--no-armor\b/, 'no-armor is shown')
  ct.notMatch(output, /--no-vlt\b/, 'no-vlt is hidden')
  ct.notMatch(output, /--no-ops\b/, 'no-ops is hidden')

  ct.end()
})
