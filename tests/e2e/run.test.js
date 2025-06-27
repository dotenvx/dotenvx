const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const dotenv = require('dotenv')
const { spawnSync } = require('child_process')

const packageJson = require('../../src/lib/helpers/packageJson')
const version = packageJson.version

let tempDir = ''
const osTempDir = fs.realpathSync(os.tmpdir())
const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function execShell (commands) {
  const result = spawnSync(commands, {
    encoding: 'utf8',
    shell: true
  })

  return {
    stdout: result.stdout ? result.stdout.trim() : null,
    stderr: result.stderr ? result.stderr.trim() : null,
    exitCode: result.status // Exit code of the command
  }
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

t.test('#run', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`).stdout, 'Hello undefined')
  ct.equal(execShell(`${dotenvx} run -- ${command}`).stdout, `[dotenvx@${version}] injecting env (1) from .env\nHello World`)
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello World') // --quiet
  ct.equal(execShell(`${dotenvx} run --debug -- ${command}`).stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[],"envVaultFile":[],"strict":false}
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
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env -- ${command}`).stdout, `[dotenvx@${version}] injecting env (1) from .env.local, .env\nHello local`)
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --quiet -- ${command}`).stdout, 'Hello local') // --quiet
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --debug -- ${command}`).stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[".env.local",".env"],"envVaultFile":[],"strict":false}
loading env from .env.local (${tempDir}/.env.local)
{"HELLO":"local"}
HELLO set
HELLO set to local
loading env from .env (${tempDir}/.env)
{"HELLO":"local"}
HELLO pre-exists (protip: use --overload to override)
HELLO pre-exists as local (protip: use --overload to override)
[dotenvx@${version}] injecting env (1) from .env.local, .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello local`) // --debug

  ct.end()
})

t.test('#run - multiple .env files --overload', ct => {
  execShell(`
    echo "HELLO=local" > .env.local
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --overload -- ${command}`).stdout, `[dotenvx@${version}] injecting env (1) from .env.local, .env\nHello World`)
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --overload --quiet -- ${command}`).stdout, 'Hello World') // --quiet
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --overload --debug -- ${command}`).stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[".env.local",".env"],"envVaultFile":[],"strict":false,"overload":true}
loading env from .env.local (${tempDir}/.env.local)
{"HELLO":"local"}
HELLO set
HELLO set to local
loading env from .env (${tempDir}/.env)
{"HELLO":"World"}
HELLO set
HELLO set to World
[dotenvx@${version}] injecting env (1) from .env.local, .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello World`) // --debug

  ct.end()
})

t.test('#run - Variable Expansion', ct => {
  execShell(`
    echo 'USERNAME="username"\nDATABASE_URL="postgres://\${USERNAME}@localhost/my_database"' > .env
    echo "console.log('DATABASE_URL', process.env.DATABASE_URL)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`).stdout, 'DATABASE_URL undefined')
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'DATABASE_URL postgres://username@localhost/my_database')

  ct.end()
})

t.test('#run - Command Substitution', ct => {
  execShell(`
    echo 'DATABASE_URL="postgres://$(whoami)@localhost/my_database"' > .env
    echo "console.log('DATABASE_URL', process.env.DATABASE_URL)" > index.js
  `)

  const command = `${node} index.js`
  const whoami = execShell('whoami').stdout
  ct.equal(execShell(`${node} index.js`).stdout, 'DATABASE_URL undefined')
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, `DATABASE_URL postgres://${whoami}@localhost/my_database`)

  ct.end()
})

t.test('#run - --env', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${dotenvx} run --env HELLO=String -f .env -- ${command}`).stdout, `[dotenvx@${version}] injecting env (1) from .env, and --env flag\nHello String`)
  ct.equal(execShell(`${dotenvx} run --env HELLO=String -f .env --quiet -- ${command}`).stdout, 'Hello String') // --quiet
  ct.equal(execShell(`${dotenvx} run --env HELLO=String -f .env --debug -- ${command}`).stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":["HELLO=String"],"envFile":[".env"],"envVaultFile":[],"strict":false}
loading env from string (HELLO=String)
{"HELLO":"String"}
HELLO set
HELLO set to String
loading env from .env (${tempDir}/.env)
{"HELLO":"String"}
HELLO pre-exists (protip: use --overload to override)
HELLO pre-exists as String (protip: use --overload to override)
[dotenvx@${version}] injecting env (1) from .env, and --env flag
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello String`) // --debug

  ct.end()
})

t.test('#run - encrypted .env', ct => {
  execShell(`
    touch .env
    ${dotenvx} set HELLO encrypted
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env')))
  const DOTENV_PUBLIC_KEY = parsedEnv.DOTENV_PUBLIC_KEY

  const command = `${node} index.js`
  ct.equal(execShell(`${dotenvx} run -- ${command}`).stdout, `[dotenvx@${version}] injecting env (2) from .env\nHello encrypted`)
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello encrypted') // --quiet
  ct.equal(execShell(`${dotenvx} run --debug -- ${command}`).stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[],"envVaultFile":[],"strict":false}
loading env from .env (${tempDir}/.env)
{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"encrypted"}
DOTENV_PUBLIC_KEY set
DOTENV_PUBLIC_KEY set to ${DOTENV_PUBLIC_KEY}
HELLO set
HELLO set to encrypted
[dotenvx@${version}] injecting env (2) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello encrypted`) // --debug

  ct.end()
})

t.test('#run - encrypted .env with no .env.keys', ct => {
  execShell(`
    touch .env
    ${dotenvx} set HELLO encrypted
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env')))
  const DOTENV_PUBLIC_KEY = parsedEnv.DOTENV_PUBLIC_KEY
  const encrypted = parsedEnv.HELLO

  execShell('rm .env.keys')

  const command = `${node} index.js`

  let o = execShell(`${dotenvx} run -- ${command}`)
  ct.equal(o.stderr, '[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=\'\n[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464')
  ct.equal(o.stdout, `[dotenvx@${version}] injecting env (2) from .env\nHello ${encrypted}`)

  o = execShell(`${dotenvx} run --quiet -- ${command}`)
  ct.equal(o.stderr, '[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=\'\n[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464')
  ct.equal(o.stdout, `Hello ${encrypted}`) // --quiet

  o = execShell(`${dotenvx} run --debug -- ${command}`)
  ct.equal(o.stderr, '[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=\'\n[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464')
  ct.equal(o.stdout, `Setting log level to debug
process command [${node} index.js]
options: {"env":[],"envFile":[],"envVaultFile":[],"strict":false}
loading env from .env (${tempDir}/.env)
{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"${encrypted}"}
DOTENV_PUBLIC_KEY set
DOTENV_PUBLIC_KEY set to ${DOTENV_PUBLIC_KEY}
HELLO set
HELLO set to ${encrypted}
[dotenvx@${version}] injecting env (2) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]
Hello ${encrypted}`) // --debug

  ct.end()
})

t.test('#run - encrypted .env with no .env.keys, with DOTENV_PRIVATE_KEY', ct => {
  execShell(`
    touch .env
    ${dotenvx} set HELLO encrypted
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))

  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY

  execShell('rm .env.keys') // no keys file

  process.env.DOTENV_PRIVATE_KEY = DOTENV_PRIVATE_KEY // set already on server

  const command = `${node} index.js`
  ct.equal(execShell(`DOTENV_PRIVATE_KEY=${DOTENV_PRIVATE_KEY} ${dotenvx} run -- ${command}`).stdout, `[dotenvx@${version}] injecting env (2) from .env\nHello encrypted`)
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello encrypted') // --quiet

  ct.end()
})

t.test('#run - encrypted .env.production with no .env.keys, with DOTENV_PRIVATE_KEY_PRODUCTION', ct => {
  execShell(`
    touch .env.production
    ${dotenvx} set HELLO production -f .env.production
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))

  const DOTENV_PRIVATE_KEY_PRODUCTION = parsedEnvKeys.DOTENV_PRIVATE_KEY_PRODUCTION

  execShell('rm .env.keys') // no keys file

  process.env.DOTENV_PRIVATE_KEY_PRODUCTION = DOTENV_PRIVATE_KEY_PRODUCTION // set already on server

  const command = `${node} index.js`
  ct.equal(execShell(`DOTENV_PRIVATE_KEY_PRODUCTION=${DOTENV_PRIVATE_KEY_PRODUCTION} ${dotenvx} run -- ${command}`).stdout, `[dotenvx@${version}] injecting env (2) from .env.production\nHello production`)
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello production') // --quiet

  ct.end()
})

t.test('#run - env var precedence: environment variables take precedence over .env files by default', ct => {
  execShell(`
    echo "MODEL_REGISTRY=registry.company.com/models/v1" > .env.prod
    echo "console.log('MODEL_REGISTRY: ' + process.env.MODEL_REGISTRY)" > index.js
  `)

  const command = `${node} index.js`
  
  // Test without environment variable set - .env file value should be used
  ct.equal(execShell(`${dotenvx} run -f .env.prod --quiet -- ${command}`).stdout, 'MODEL_REGISTRY: registry.company.com/models/v1')
  
  // Test with environment variable set - environment variable should take precedence
  ct.equal(execShell(`MODEL_REGISTRY=registry.azure.com/models/v2 ${dotenvx} run -f .env.prod --quiet -- ${command}`).stdout, 'MODEL_REGISTRY: registry.azure.com/models/v2')
  
  // Test with --overload flag - .env file should override environment variable
  ct.equal(execShell(`MODEL_REGISTRY=registry.azure.com/models/v2 ${dotenvx} run -f .env.prod --overload --quiet -- ${command}`).stdout, 'MODEL_REGISTRY: registry.company.com/models/v1')

  ct.end()
})
