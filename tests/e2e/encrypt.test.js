const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { which } = require('@dotenvx/tooling')
const { dotenv } = require('@dotenvx/tooling')
const { execSync, spawnSync } = require('child_process')

let tempDir = ''
const osTempDir = fs.realpathSync(os.tmpdir())
const originalDir = process.cwd()

const node = path.resolve(which.sync('node')) // /opt/homebrew/node
const dotenvx = `${node} ${path.join(originalDir, 'src/cli/dotenvx.js')}`

function stripArmorStatus (output) {
  return output
    .split('\n')
    .filter(line => !line.match(/^\[dotenvx@.+\] ⛨ (armor): (on|off)$/))
    .join('\n')
}

function execShell (commands) {
  const output = execSync(commands, {
    encoding: 'utf8',
    shell: true
  }).trim()

  return stripArmorStatus(output)
}

function execShellResult (commands) {
  const result = spawnSync(commands, {
    encoding: 'utf8',
    shell: true
  })

  return {
    stdout: stripArmorStatus(result.stdout.trim()),
    stderr: result.stderr.trim(),
    status: result.status
  }
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

t.test('#encrypt', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  const output = execShellResult(`${dotenvx} encrypt`)

  ct.equal(output.stdout, '')
  ct.equal(output.stderr, '◈ encrypted (.env)')

  ct.end()
})

t.test('#encrypt creates a minimal sample env', ct => {
  const output = execShellResult(`${dotenvx} encrypt`)
  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env')))

  ct.equal(output.stdout, '')
  ct.equal(output.stderr, '◈ encrypted (.env)')
  ct.same(Object.keys(parsedEnv).sort(), ['DOTENV_PUBLIC_KEY', 'HELLO'])
  ct.equal(execShell(`${dotenvx} get HELLO`), 'World')

  ct.end()
})

t.test('encrypt and set create owner-only key files under umask 022', { skip: process.platform === 'win32' }, ct => {
  for (const [command, keysFile] of [['encrypt', '.env.keys'], ['set HELLO World', 'custom.keys']]) {
    if (fs.existsSync('.env')) fs.unlinkSync('.env')
    const result = execShellResult(`umask 022\n${dotenvx} ${command} -fk ${keysFile}`)
    ct.equal(result.status, 0, result.stderr)
    ct.equal(fs.statSync(keysFile).mode & 0o777, 0o600)
    ct.equal(fs.statSync('.env').mode & 0o777, 0o644, 'ordinary env file keeps default permissions')
  }
  ct.end()
})

t.test('#encrypt -k', ct => {
  ct.plan(8)

  execShell(`
    echo "HELLO=World\nHI=thar" > .env
  `)

  const output = execShellResult(`${dotenvx} encrypt -k HI`)

  const parsedEnvKeys = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env.keys')))
  const DOTENV_PRIVATE_KEY = parsedEnvKeys.DOTENV_PRIVATE_KEY

  ct.equal(output.stdout, '')
  ct.equal(output.stderr, '◈ encrypted (.env)')

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
