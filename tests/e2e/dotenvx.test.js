const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const { execSync } = require('child_process')

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

const tempDir = fs.realpathSync(os.tmpdir())
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

t.test('#--version', ct => {
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} --version`), version)

  ct.end()
})

t.test('#run', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`), 'Hello undefined')
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run -- ${command}`), `[dotenvx@${version}] injecting env (1) from .env\nHello World`)
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run --quiet -- ${command}`), 'Hello World') // --quiet
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run --debug -- ${command}`), `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[],"envVaultFile":[]}
loading env from .env (${tempDir}/.env)
{"HELLO":"World"}
HELLO set
HELLO set to World
[dotenvx@${version}] injecting env (1) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello World`) // --debug

  ct.end()
})

t.test('#run - multiple .env files', ct => {
  execShell(`
    echo "HELLO=local" > .env.local
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run -f .env.local -f .env -- ${command}`), `[dotenvx@${version}] injecting env (1) from .env.local, .env\nHello local`)
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run -f .env.local -f .env --quiet -- ${command}`), 'Hello local') // --quiet
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run -f .env.local -f .env --debug -- ${command}`), `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[".env.local",".env"],"envVaultFile":[]}
loading env from .env.local (${tempDir}/.env.local)
{"HELLO":"local"}
HELLO set
HELLO set to local
loading env from .env (${tempDir}/.env)
{"HELLO":"World"}
HELLO pre-exists (protip: use --overload to override)
HELLO pre-exists as local (protip: use --overload to override)
[dotenvx@${version}] injecting env (1) from .env.local, .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello local`) // --debug

  ct.end()
})


t.test('#run - Variable Expansion', ct => {
  execShell(`
    echo 'USERNAME="username"\nDATABASE_URL="postgres://\${USERNAME}@localhost/my_database"' > .env
    echo "console.log('DATABASE_URL', process.env.DATABASE_URL)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`), 'DATABASE_URL undefined')
  ct.equal(execShell(`${node} ${path.join(originalDir, 'src/cli/dotenvx.js')} run --quiet -- ${command}`), 'DATABASE_URL postgres://username@localhost/my_database')

  ct.end()
})
