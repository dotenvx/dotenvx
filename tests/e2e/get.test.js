const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { which } = require('@dotenvx/tooling')
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
  process.env = { CI: 'true' } // These fixtures exercise file storage.
  process.env.DOTENVX_NO_ARMOR = 'true'

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

t.test('#get --include-key', ct => {
  execShell(`
    printf "HELLO=World\nHOLA=Mundo\nGOODBYE=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get -ik 'H*'`), '{"HELLO":"World","HOLA":"Mundo"}')
  ct.equal(execShell(`${dotenvx} get --include-key HELLO GOODBYE`), '{"HELLO":"World","GOODBYE":"World"}')

  ct.end()
})

t.test('#get --exclude-key', ct => {
  execShell(`
    printf "DOTENV_PUBLIC_KEY=public\nDOTENV_PUBLIC_KEY_PRODUCTION=production\nHELLO=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get -ek 'DOTENV_PUBLIC_KEY*'`), '{"HELLO":"World"}')
  ct.equal(execShell(`${dotenvx} get --format=shell --exclude-key 'DOTENV_PUBLIC_KEY*'`), 'HELLO=World')
  ct.equal(execShell(`${dotenvx} get --format=colon -ek 'DOTENV_PUBLIC_KEY*'`), 'HELLO:World')
  ct.equal(execShell(`${dotenvx} get --format=eval -ek 'DOTENV_PUBLIC_KEY*'`), "HELLO='World'")
  ct.equal(execShell(`${dotenvx} get --format=eval-export -ek 'DOTENV_PUBLIC_KEY*'`), "export HELLO='World'")

  ct.end()
})

t.test('#get --include-key --exclude-key', ct => {
  execShell(`
    printf "HELLO=World\nHOLA=Mundo\nGOODBYE=World" > .env
  `)

  ct.equal(execShell(`${dotenvx} get -ik 'H*' -ek HOLA`), '{"HELLO":"World"}')

  ct.end()
})
