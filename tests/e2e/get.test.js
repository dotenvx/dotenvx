const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

let tempDir = ''
const osTempDir = fs.realpathSync(os.tmpdir())
const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  tempDir = fs.mkdtempSync(path.join(osTempDir, 'dotenvx-test-'))

  // go to tempDir
  process.chdir(tempDir)
})

t.afterEach((ct) => {
  // cleanup
  process.chdir(originalDir)
})

t.test('#get', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get HELLO`), 'World')

  ct.end()
})

t.test('#get --env', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get HELLO --env HELLO=String`), 'World')
  ct.equal(execShell(`${dotenvx} get HELLO --env HELLO=String -f .env`), 'String')
  ct.equal(execShell(`${dotenvx} get HELLO -f .env --env HELLO=String`), 'World')

  ct.end()
})

t.test('#get --overload', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "HELLO=production" > .env.production
  `)

  ct.equal(execShell(`${dotenvx} get HELLO -f .env.production --env HELLO=String -f .env --overload`), 'World')

  ct.end()
})

t.test('#get (json)', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get`), '{"HELLO":"World"}')

  ct.end()
})

t.test('#get --format eval -f .env.test', ct => {
  execShell(`
    echo "FOO=BAR" > .env.test
  `)

  ct.equal(execShell(`${dotenvx} get --format eval -f .env.test`), 'FOO="BAR"')

  ct.end()
})
