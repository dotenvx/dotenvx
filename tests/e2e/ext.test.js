const t = require('tap')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

t.test('ext hub', ct => {
  const output = execShell(`${dotenvx} ext hub`)

  t.match(output, /\[INSTALLATION_NEEDED\] install dotenvx-ext-hub to use \[dotenvx ext hub\] commands/, 'shoud say installation needed')
  t.match(output, /see installation instructions/, 'shoud say see installation instructions')

  ct.end()
})
