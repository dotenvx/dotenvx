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

  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt -k HELLO`)
})

t.afterEach((ct) => {
  execShell('rm .env .env.keys')

  // cleanup
  process.chdir(originalDir)
})

t.test('#lock', ct => {
  const output = execShell(`${dotenvx} ext lock myPassword`)

  ct.equal(output, '✔ .env.keys (DOTENV_PRIVATE_KEY) locked')
  const parsedEnvKeysAfter = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))

  const DOTENV_PRIVATE_KEY = parsedEnvKeysAfter.DOTENV_PRIVATE_KEY
  ct.equal(DOTENV_PRIVATE_KEY.startsWith('encrypted:'), true, 'DOTENV_PRIVATE_KEY should be encrypted')

  ct.end()
})

t.test('#unlock', ct => {
  ct.plan(4)
  const outputLocked = execShell(`${dotenvx} ext lock myPassword`)
  ct.equal(outputLocked, '✔ .env.keys (DOTENV_PRIVATE_KEY) locked')

  const outputUnLocked = execShell(`${dotenvx} ext unlock myPassword`)
  ct.equal(outputUnLocked, '✔ .env.keys (DOTENV_PRIVATE_KEY) unlocked')

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY
  ct.equal(DOTENV_PRIVATE_KEY.startsWith('encrypted:'), false, 'DOTENV_PRIVATE_KEY should NOT be encrypted')

  ct.equal(execShell(`${dotenvx} get HELLO`), 'World') // unencrypted still

  ct.end()
})
