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

t.test('#--help hides armor alias', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.notMatch(output, /\barmor\b/, 'armor alias is hidden from help output')

  ct.end()
})

t.test('#--help shows vlt advanced command', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.match(output, /vlt\s+⛨ ARMORED KEYS \[www\.dotenvx\.com\/vlt\]/, 'vlt advanced command is shown')
  ct.notMatch(output, /ops\s+⛨ ARMORED KEYS \[www\.dotenvx\.com\/vlt\]/, 'ops advanced command is not shown')

  ct.end()
})

t.test('#--help hides login command', ct => {
  const output = execShell(`${dotenvx} --help`)

  ct.notMatch(output, /\blogin\b/, 'login is hidden from help output')

  ct.end()
})
