const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { which } = require('@dotenvx/tooling')
const { dotenv } = require('@dotenvx/tooling')
const { spawnSync } = require('child_process')

let tempDir = ''
const osTempDir = fs.realpathSync(os.tmpdir())
const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function stripArmorStatus (output) {
  if (!output) {
    return output
  }

  return output
    .split('\n')
    .filter(line => !line.match(/^\[dotenvx@.+\] ⛨ (armor): (on|off)$/))
    .filter(line => !line.match(/^(┆ )?(armor): (on|off)$/))
    .join('\n')
}

function modernizeDebugOutput (output) {
  return output
    .replace(/^Setting log level to debug$/m, '┆ setting log level to: debug')
    .replace(/^(process command .*|options: .*|loading env from .*|\{.*\}|HELLO .*|DOTENV_PUBLIC_KEY .*|executing process command .*|expanding process command .*)$/gm, '┆ $1')
}

function execShell (commands) {
  const result = spawnSync(commands, {
    encoding: 'utf8',
    shell: true
  })

  return {
    stdout: result.stdout ? stripArmorStatus(result.stdout.trim()) : null,
    stderr: result.stderr ? stripArmorStatus(result.stderr.trim()) : null,
    exitCode: result.status // Exit code of the command
  }
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

t.test('#run', ct => {
  execShell(`
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${node} index.js`).stdout, 'Hello undefined')
  const output = execShell(`${dotenvx} run -- ${command}`)
  ct.equal(output.stdout, 'Hello World')
  ct.equal(output.stderr, '⟐ injected env (1) from .env')

  const quietOutput = execShell(`${dotenvx} run --quiet -- ${command}`)
  ct.equal(quietOutput.stdout, 'Hello World')
  ct.equal(quietOutput.stderr, null)

  const dotenvConfigQuietOutput = execShell(`DOTENV_CONFIG_QUIET=true ${dotenvx} run -- ${command}`)
  ct.equal(dotenvConfigQuietOutput.stdout, 'Hello World')
  ct.equal(dotenvConfigQuietOutput.stderr, null)
  const debugOutput = execShell(`${dotenvx} run --debug -- ${command}`)
  ct.equal(debugOutput.stdout, 'Hello World')
  ct.equal(debugOutput.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":[],"envFile":[],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true}
process command [${node} index.js]
loading env from .env (${tempDir}/.env)
{"HELLO":"World"}
HELLO set
HELLO set to World
⟐ injected env (1) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

  ct.end()
})

t.test('#run - multiple .env files', ct => {
  execShell(`
    echo "HELLO=local" > .env.local
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env -- ${command}`).stdout, 'Hello local')
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --quiet -- ${command}`).stdout, 'Hello local') // --quiet
  const debugOutput = execShell(`${dotenvx} run -f .env.local -f .env --debug -- ${command}`)
  ct.equal(debugOutput.stdout, 'Hello local')
  ct.equal(debugOutput.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":[],"envFile":[".env.local",".env"],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true}
process command [${node} index.js]
loading env from .env.local (${tempDir}/.env.local)
{"HELLO":"local"}
HELLO set
HELLO set to local
loading env from .env (${tempDir}/.env)
{"HELLO":"local"}
HELLO pre-exists (protip: use --overload to override)
HELLO pre-exists as local (protip: use --overload to override)
⟐ injected env (1) from .env.local, .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

  ct.end()
})

t.test('#run - multiple .env files --overload', ct => {
  execShell(`
    echo "HELLO=local" > .env.local
    echo "HELLO=World" > .env
    echo "console.log('Hello ' + process.env.HELLO)" > index.js
  `)

  const command = `${node} index.js`
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --overload -- ${command}`).stdout, 'Hello World')
  ct.equal(execShell(`${dotenvx} run -f .env.local -f .env --overload --quiet -- ${command}`).stdout, 'Hello World') // --quiet
  const debugOutput = execShell(`${dotenvx} run -f .env.local -f .env --overload --debug -- ${command}`)
  ct.equal(debugOutput.stdout, 'Hello World')
  ct.equal(debugOutput.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":[],"envFile":[".env.local",".env"],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true,"overload":true}
process command [${node} index.js]
loading env from .env.local (${tempDir}/.env.local)
{"HELLO":"local"}
HELLO set
HELLO set to local
loading env from .env (${tempDir}/.env)
{"HELLO":"World"}
HELLO set
HELLO set to World
⟐ injected env (1) from .env.local, .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

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
  ct.equal(execShell(`${dotenvx} run --env HELLO=String -f .env -- ${command}`).stdout, 'Hello String')
  ct.equal(execShell(`${dotenvx} run --env HELLO=String -f .env --quiet -- ${command}`).stdout, 'Hello String') // --quiet
  const debugOutput = execShell(`${dotenvx} run --env HELLO=String -f .env --debug -- ${command}`)
  ct.equal(debugOutput.stdout, 'Hello String')
  ct.equal(debugOutput.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":["HELLO=String"],"envFile":[".env"],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true}
process command [${node} index.js]
loading env from string (HELLO=String)
{"HELLO":"String"}
HELLO set
HELLO set to String
loading env from .env (${tempDir}/.env)
{"HELLO":"String"}
HELLO pre-exists (protip: use --overload to override)
HELLO pre-exists as String (protip: use --overload to override)
⟐ injected env (1) from .env, and --env flag
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

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
  ct.equal(execShell(`${dotenvx} run -- ${command}`).stdout, 'Hello encrypted')
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello encrypted') // --quiet
  const debugOutput = execShell(`${dotenvx} run --debug -- ${command}`)
  ct.equal(debugOutput.stdout, 'Hello encrypted')
  ct.equal(debugOutput.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":[],"envFile":[],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true}
process command [${node} index.js]
loading env from .env (${tempDir}/.env)
{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"encrypted"}
DOTENV_PUBLIC_KEY set
DOTENV_PUBLIC_KEY set to ${DOTENV_PUBLIC_KEY}
HELLO set
HELLO set to encrypted
⟐ injected env (2) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

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
  ct.equal(o.stderr, '☠ [DECRYPTION_FAILED] could not decrypt HELLO. fix: [https://github.com/dotenvx/dotenvx/issues/757]\n⟐ injected env (2) from .env')
  ct.equal(o.stdout, `Hello ${encrypted}`)

  o = execShell(`${dotenvx} run --quiet -- ${command}`)
  ct.equal(o.stderr, '☠ [DECRYPTION_FAILED] could not decrypt HELLO. fix: [https://github.com/dotenvx/dotenvx/issues/757]')
  ct.equal(o.stdout, `Hello ${encrypted}`) // --quiet

  o = execShell(`${dotenvx} run --debug -- ${command}`)
  ct.equal(o.stdout, `Hello ${encrypted}`)
  ct.equal(o.stderr, modernizeDebugOutput(`Setting log level to debug
options: {"env":[],"envFile":[],"redact":false,"validate":false,"strict":false,"armor":true,"native":true,"1password":true,"bitwarden":true}
process command [${node} index.js]
loading env from .env (${tempDir}/.env)
☠ [DECRYPTION_FAILED] could not decrypt HELLO. fix: [https://github.com/dotenvx/dotenvx/issues/757]
{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"${encrypted}"}
DOTENV_PUBLIC_KEY set
DOTENV_PUBLIC_KEY set to ${DOTENV_PUBLIC_KEY}
HELLO set
HELLO set to ${encrypted}
⟐ injected env (2) from .env
executing process command [${node} index.js]
expanding process command to [${node} index.js]`)) // --debug

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
  ct.equal(execShell(`DOTENV_PRIVATE_KEY=${DOTENV_PRIVATE_KEY} ${dotenvx} run -- ${command}`).stdout, 'Hello encrypted')
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
  ct.equal(execShell(`DOTENV_PRIVATE_KEY_PRODUCTION=${DOTENV_PRIVATE_KEY_PRODUCTION} ${dotenvx} run -- ${command}`).stdout, 'Hello production')
  ct.equal(execShell(`${dotenvx} run --quiet -- ${command}`).stdout, 'Hello production') // --quiet

  ct.end()
})

t.test('#run - redacts injected values from stdout and stderr except _PLAIN values', ct => {
  execShell(`
    echo "SECRET=super-secret-value" > .env
    echo "PUBLIC=public-value" >> .env
    echo "VISIBLE_PLAIN=visible-value" >> .env
    echo "process.stdout.write('stdout ' + process.env.SECRET + ' ' + process.env.PUBLIC + ' ' + process.env.INLINE + ' ' + process.env.VISIBLE_PLAIN); process.stderr.write('stderr ' + process.env.SECRET + ' ' + process.env.PUBLIC + ' ' + process.env.INLINE + ' ' + process.env.VISIBLE_PLAIN)" > index.js
  `)

  const command = `${node} index.js`
  const output = execShell(`${dotenvx} run --quiet --redact --env INLINE=inline-value -- ${command}`)

  ct.equal(output.stdout, 'stdout [REDACTED] [REDACTED] [REDACTED] visible-value')
  ct.equal(output.stderr, 'stderr [REDACTED] [REDACTED] [REDACTED] visible-value')
  ct.notMatch(output.stdout, /super-secret-value/)
  ct.notMatch(output.stderr, /super-secret-value/)
  ct.notMatch(output.stdout, /public-value/)
  ct.notMatch(output.stderr, /public-value/)

  const unredactedOutput = execShell(`${dotenvx} run --quiet --env INLINE=inline-value -- ${command}`)
  ct.equal(unredactedOutput.stdout, 'stdout super-secret-value public-value inline-value visible-value')
  ct.equal(unredactedOutput.stderr, 'stderr super-secret-value public-value inline-value visible-value')

  ct.end()
})

t.test('#run - redacts injected values repeated in command failure diagnostics', ct => {
  execShell(`
    touch .env
    ${dotenvx} set SECRET super-secret-value
    echo "process.stderr.write(process.env.SECRET); process.exit(1)" > index.js
  `)

  const command = `${node} index.js`
  const output = execShell(`${dotenvx} run --quiet --redact -- ${command}`)

  ct.match(output.stderr, /\[REDACTED\]/)
  ct.notMatch(output.stderr, /super-secret-value/)
  ct.equal(output.exitCode, 1)

  ct.end()
})

t.test('#run - redacts pre-existing values when their keys are declared in .env', ct => {
  execShell(`
    echo "SECRET=file-secret" > .env
    echo "VISIBLE_PLAIN=file-visible" >> .env
    echo "process.stdout.write(process.env.SECRET + ' ' + process.env.VISIBLE_PLAIN)" > index.js
  `)

  const command = `${node} index.js`
  const output = execShell(`SECRET=external-secret VISIBLE_PLAIN=external-visible ${dotenvx} run --quiet --redact -- ${command}`)

  ct.equal(output.stdout, '[REDACTED] external-visible')
  ct.notMatch(output.stdout, /external-secret/)

  const unredactedOutput = execShell(`SECRET=external-secret VISIBLE_PLAIN=external-visible ${dotenvx} run --quiet -- ${command}`)
  ct.equal(unredactedOutput.stdout, 'external-secret external-visible')

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
