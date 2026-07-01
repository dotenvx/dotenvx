const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const dotenv = require('dotenv')
const { execSync } = require('child_process')

let tempDir = ''
const osTempDir = fs.realpathSync(os.tmpdir())
const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function stripArmorStatus (output) {
  return output
    .split('\n')
    .filter(line => !line.match(/^\[dotenvx@.+\] ⛨ (armor|ops|vlt): (on|off)$/))
    .join('\n')
}

function execShell (commands) {
  const output = execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()

  return stripArmorStatus(output)
}

function execShellFailure (commands) {
  try {
    execShell(commands)
  } catch (error) {
    return {
      status: error.status,
      stdout: stripArmorStatus(error.stdout.toString().trim()),
      stderr: error.stderr.toString()
    }
  }
}

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  process.env.DOTENVX_NO_ARMOR = 'true'

  tempDir = fs.mkdtempSync(path.join(osTempDir, 'dotenvx-test-'))

  // go to tempDir
  process.chdir(tempDir)
})

t.afterEach((ct) => {
  // cleanup
  process.chdir(originalDir)
})

t.test('#encrypt', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  const output = execShell(`${dotenvx} encrypt`)

  ct.equal(output, '◈ encrypted (.env)')

  ct.end()
})

t.test('#encrypt -k', ct => {
  ct.plan(7)

  execShell(`
    echo "HELLO=World\nHI=thar" > .env
  `)

  const output = execShell(`${dotenvx} encrypt -k HI`)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY

  ct.equal(output, '◈ encrypted (.env)')

  execShell('rm .env.keys')

  const helloResult = execShellFailure(`${dotenvx} get HELLO`)
  ct.equal(helloResult.status, 1, 'get exits when another key cannot be decrypted')
  ct.equal(helloResult.stdout, 'World') // unencrypted still
  ct.match(helloResult.stderr, /DECRYPTION_FAILED/)

  const hiResult = execShellFailure(`${dotenvx} get HI`)
  ct.equal(hiResult.status, 1, 'get exits when requested encrypted key cannot be decrypted')
  ct.match(hiResult.stdout, /^encrypted:/, 'HI should be encrypted')

  process.env.DOTENV_PRIVATE_KEY = DOTENV_PRIVATE_KEY
  ct.equal(execShell(`${dotenvx} get HI`), 'thar')

  ct.end()
})
