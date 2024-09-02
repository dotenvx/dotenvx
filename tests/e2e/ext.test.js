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

t.test('ext', ct => {
  const output = execShell(`${dotenvx} ext`)

  t.match(output, /genexample/, 'shoud say genexample')
  t.match(output, /gitignore/, 'shoud say gitignore')
  t.match(output, /prebuild/, 'shoud say prebuild')
  t.match(output, /precommit/, 'shoud say precommit')

  ct.end()
})

t.test('ext missing', ct => {
  const output = execShell(`${dotenvx} ext missing`)

  t.match(output, "error: unknown command 'missing'", 'shoud say installation needed')

  ct.end()
})

t.test('ext vault', ct => {
  const output = execShell(`${dotenvx} ext vault`)

  t.match(output, /\[INSTALLATION_NEEDED\] install dotenvx-ext-vault to use \[dotenvx ext vault\] commands/, 'shoud say installation needed')
  t.match(output, /see installation instructions/, 'shoud say see installation instructions')

  ct.end()
})
