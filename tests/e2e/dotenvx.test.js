const t = require('tap')
const os = require('os')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

const tempDir = os.tmpdir()
const originalDir = process.cwd()

function execShell (commands) {
  return execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  // go to tempDir
  process.chdir(tempDir)
})

t.afterEach((ct) => {
  // cleanup
  process.chdir(originalDir)
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
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run --debug -- ${command}`), `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[],"envVaultFile":[]}
loading env from .env (/private${tempDir}/.env)
{"HELLO":"World"}
HELLO set
HELLO set to World
[dotenvx@${version}] injecting env (1) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello World`) // --debug

  ct.end()
})
