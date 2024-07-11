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

t.test('#decrypt', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)
  const DOTENV_PUBLIC_KEY = execShell(`${dotenvx} get DOTENV_PUBLIC_KEY`)

  const output = execShell(`${dotenvx} decrypt`)
  ct.equal(output, '✔ decrypted (.env)')

  execShell('rm .env.keys')

  // it can still get the values because they were decrypted
  const output2 = execShell(`${dotenvx} get`)
  ct.equal(output2, `{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"World"}`)

  ct.end()
})

t.test('#decrypt --stdout', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)
  const DOTENV_PUBLIC_KEY = execShell(`${dotenvx} get DOTENV_PUBLIC_KEY`)

  execShell(`${dotenvx} decrypt --stdout > filename.txt`)

  ct.equal(fs.readFileSync(path.join(tempDir, 'filename.txt'), { encoding: 'utf8' }), `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="${DOTENV_PUBLIC_KEY}"

# .env
HELLO="World"\n`)

  ct.end()
})
