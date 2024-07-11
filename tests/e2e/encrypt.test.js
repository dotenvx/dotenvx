const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const which = require('which')
const dotenv = require('dotenv')
const { execSync } = require('child_process')

const keyPair = require('../../src/lib/helpers/keyPair')

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

t.test('#encrypt', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  const output = execShell(`${dotenvx} encrypt`)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY

  ct.equal(output, `✔ encrypted (.env)
✔ key added to .env.keys (DOTENV_PRIVATE_KEY)
ℹ add .env.keys to .gitignore: [echo ".env.keys" >> .gitignore]
ℹ run [DOTENV_PRIVATE_KEY='${DOTENV_PRIVATE_KEY}' dotenvx run -- yourcommand] to test decryption locally`)

  ct.end()
})

t.test('#encrypt -k', ct => {
  ct.plan(4)

  execShell(`
    echo "HELLO=World\nHI=thar" > .env
  `)

  const output = execShell(`${dotenvx} encrypt -k HI`)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY

  ct.equal(output, `✔ encrypted (.env)
✔ key added to .env.keys (DOTENV_PRIVATE_KEY)
ℹ add .env.keys to .gitignore: [echo ".env.keys" >> .gitignore]
ℹ run [DOTENV_PRIVATE_KEY='${DOTENV_PRIVATE_KEY}' dotenvx run -- yourcommand] to test decryption locally`)

  execShell('rm .env.keys')

  ct.equal(execShell(`${dotenvx} get HELLO`), 'World') // unencrypted still
  ct.match(execShell(`${dotenvx} get HI`), /^encrypted:/, 'HI should be encrypted')

  process.env.DOTENV_PRIVATE_KEY = DOTENV_PRIVATE_KEY
  ct.equal(execShell(`${dotenvx} get HI`), 'thar')

  ct.end()
})

t.test('#run - encrypt -k --stdout', ct => {
  execShell(`
    echo "HELLO=World\nHI=thar" > .env
  `)

  const output = execShell(`${dotenvx} encrypt -k HI --stdout`)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY
  const { publicKey } = keyPair(DOTENV_PRIVATE_KEY)

  const expectedFixedPart1 = `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="${publicKey}"

# .env
HELLO=World
HI="encrypted:`

  const parts = output.split('HI="encrypted:')
  const encryptedPart = parts[1]
  const unencryptedPart = `${parts[0]}HI="encrypted:`

  ct.equal(unencryptedPart, expectedFixedPart1, 'The fixed part of the output should match the expected output')
  ct.match(encryptedPart, /.*"/, 'The encrypted part should match the expected pattern')

  ct.end()
})
