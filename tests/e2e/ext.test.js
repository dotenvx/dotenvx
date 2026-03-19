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

  t.match(output, /genexample/, 'should say genexample')
  t.match(output, /lock/, 'should say lock')
  t.match(output, /unlock/, 'should say unlock')
  t.match(output, /gitignore/, 'should say gitignore')
  t.match(output, /prebuild/, 'should say prebuild')
  t.match(output, /precommit/, 'should say precommit')

  ct.end()
})

t.test('ext missing', ct => {
  const output = execShell(`${dotenvx} ext missing`)

  t.match(output, "error: unknown command 'missing'", 'should say installation needed')

  ct.end()
})

t.test('ext vault', ct => {
  const output = execShell(`${dotenvx} ext vault`)

  t.match(output, /\[INSTALLATION_NEEDED\] install dotenvx-ext-vault to use \[dotenvx ext vault\] commands/, 'should say installation needed')
  t.match(output, /see installation instructions/, 'should say see installation instructions')

  ct.end()
})
