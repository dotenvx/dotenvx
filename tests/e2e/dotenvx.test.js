const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

const originalDir = process.cwd()

function execShell(commands) {
  console.log('commands', commands)
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-test-'))
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  const tempDir = createTempDir()
  process.chdir(tempDir)
})

t.test('#run', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`), 'Hello undefined')
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} --version`), version)
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run -- ${command}`), `[dotenvx@${version}] injecting env (1) from .env\nHello World`)
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run --quiet -- ${command}`), 'Hello World') // --quiet

  ct.end()
})
