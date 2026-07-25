const t = require('tap')
const path = require('path')
const { which } = require('@dotenvx/tooling')
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
  ct.match(output, /Professional Security:[\s\S]*native\s+⌥ move private keys into your OS secret store[\s\S]*armor\s+⛨ move private keys into Dotenvx Armor \[www\.dotenvx\.com\/armor\]/, 'professional security commands include armor')
  ct.notMatch(output, /\n\s+login\s+log in to move keys off-device/, 'root help does not show login')
  ct.notMatch(output, /\n\s+logout\s+log out of connected security features/, 'root help does not show logout')
  ct.match(output, /\n\s+curl\s+⛨ call authenticated api to Dotenvx Armor \[www\.dotenvx\.com\/armor\]/, 'root help shows curl')
  ct.match(output, /armor\s+⛨ move private keys into Dotenvx Armor \[www\.dotenvx\.com\/armor\]/, 'armor advanced command is shown')
  ct.notMatch(output, /ext\s+⊕ extensions/, 'ext command is not shown')

  ct.end()
})

t.test('#armor --help shows login and logout commands', ct => {
  const output = execShell(`${dotenvx} armor --help`)

  ct.match(output, /login\s+\[options\]\s+log in to Dotenvx Armor/, 'login is shown in armor help output')
  ct.match(output, /logout\s+\[options\]\s+log out of Dotenvx Armor/, 'logout is shown in armor help output')

  ct.end()
})

t.test('#run --help shows redaction, armor, native, and secret manager flags', ct => {
  const output = execShell(`${dotenvx} run --help`)

  ct.match(output, /--redact\b/, 'redact is shown')
  ct.notMatch(output, /--no-redact\b/, 'no-redact is removed')
  ct.match(output, /--no-armor\b/, 'no-armor is shown')
  ct.match(output, /--no-native\b/, 'no-native is shown')
  ct.match(output, /--no-1password\b/, 'no-1password is shown')
  ct.match(output, /--no-bitwarden\b/, 'no-bitwarden is shown')
  ct.notMatch(output, /--no-keychain\b/, 'no-keychain is removed')

  ct.end()
})
