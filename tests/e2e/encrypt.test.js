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
  ct.match(output.stderr, /^◈ encrypted \.env \([0-9A-F]{3} [0-9A-F]{3}\) via [^\n]+$/)

  ct.end()
})

t.test('#encrypt creates a minimal sample env', ct => {
  const output = execShellResult(`${dotenvx} encrypt`)
  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(tempDir, '.env')))

  ct.equal(output.stdout, '')
  ct.match(output.stderr, /^◈ encrypted \.env \([0-9A-F]{3} [0-9A-F]{3}\) via [^\n]+$/)
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
  ct.match(output.stderr, /^◈ encrypted \.env \([0-9A-F]{3} [0-9A-F]{3}\) via [^\n]+$/)

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

t.test('#encrypt --with uses the supplied public key without a local private key', ct => {
  const { keypair, decrypt } = require('@dotenvx/primitives')
  const { publicKey, privateKey } = keypair()
  fs.writeFileSync('.env.production', 'HELLO=World\n')
  fs.writeFileSync('.env.keys', '# unrelated keys must remain untouched\n')
  const result = execShellResult(`${dotenvx} encrypt -f .env.production --with ${publicKey}`)
  const parsed = dotenv.parse(fs.readFileSync('.env.production'))
  ct.equal(result.status, 0, result.stderr)
  ct.equal(parsed.DOTENV_PUBLIC_KEY_PRODUCTION, publicKey)
  ct.equal(decrypt(privateKey, parsed.HELLO), 'World')
  ct.equal(fs.readFileSync('.env.keys', 'utf8'), '# unrelated keys must remain untouched\n')
  ct.end()
})

t.test('#encrypt --with rejects existing encryption before applying filters', ct => {
  const { keypair, encrypt } = require('@dotenvx/primitives')
  const { publicKey } = keypair()
  const fixtures = [
    `DOTENV_PUBLIC_KEY="${publicKey}"\n`,
    'export DOTENV_PUBLIC_KEY_PRODUCTION=""\n',
    'DOTENV_PUBLIC_KEY_CUSTOM=invalid\n',
    `SECRET="${encrypt(publicKey, 'secret')}"\n`,
    'SECRET="encrypted:malformed"\n',
    'SECRET="encrypted:"\nSECRET=plaintext\n'
  ]
  for (const fixture of fixtures) {
    for (const flags of ['', '--stdout', '-k HELLO', '-ek SECRET']) {
      const source = fixture + 'HELLO=World\n'
      fs.writeFileSync('.env', source)
      const result = execShellResult(`${dotenvx} encrypt --with ${publicKey} ${flags}`)
      ct.equal(result.status, 1, result.stderr)
      ct.match(result.stderr, '[ALREADY_ENCRYPTED] .env is already configured for encryption. fix: use a fresh .env file')
      ct.equal(result.stdout, '')
      ct.equal(fs.readFileSync('.env', 'utf8'), source)
      ct.equal(fs.existsSync('.env.keys'), false)
    }
  }
  ct.end()
})

t.test('#enc --with --stdout encrypts without writing files', ct => {
  const { keypair, decrypt } = require('@dotenvx/primitives')
  const { publicKey, privateKey } = keypair()
  const source = 'HELLO=World\n'
  fs.writeFileSync('.env', source)
  const result = execShellResult(`${dotenvx} enc --with ${publicKey} --stdout`)
  const parsed = dotenv.parse(result.stdout)
  ct.equal(result.status, 0, result.stderr)
  ct.equal(parsed.DOTENV_PUBLIC_KEY, publicKey)
  ct.equal(decrypt(privateKey, parsed.HELLO), 'World')
  ct.equal(fs.readFileSync('.env', 'utf8'), source)
  ct.equal(fs.existsSync('.env.keys'), false)
  ct.end()
})

t.test('#encrypt --with validates the public key even with no selected values', ct => {
  for (const key of ['invalid', '02' + '00'.repeat(32)]) {
    const source = 'HELLO_PLAIN=World\n'
    fs.writeFileSync('.env', source)
    const result = execShellResult(`${dotenvx} encrypt --with ${key}`)
    ct.equal(result.status, 1, result.stderr)
    ct.match(result.stderr, '[INVALID_PUBLIC_KEY]')
    ct.match(result.stderr, 'fix:')
    ct.equal(fs.readFileSync('.env', 'utf8'), source)
    ct.equal(fs.existsSync('.env.keys'), false)
  }
  ct.end()
})

t.test('#encrypt --with records the key even with no selected values', ct => {
  const { publicKey } = require('@dotenvx/primitives').keypair()
  fs.writeFileSync('.env', 'HELLO_PLAIN=World\n')
  const result = execShellResult(`${dotenvx} encrypt --with ${publicKey}`)
  ct.equal(result.status, 0, result.stderr)
  const parsed = dotenv.parse(fs.readFileSync('.env'))
  ct.equal(parsed.DOTENV_PUBLIC_KEY, publicKey)
  ct.equal(parsed.HELLO_PLAIN, 'World')
  ct.equal(fs.existsSync('.env.keys'), false)
  ct.end()
})

t.test('#encrypt --with creates an encrypted sample unless --no-create is set', ct => {
  const { keypair, decrypt } = require('@dotenvx/primitives')
  const { publicKey, privateKey } = keypair()
  const missing = execShellResult(`${dotenvx} encrypt --with ${publicKey} --no-create`)
  ct.equal(missing.status, 1)
  ct.match(missing.stderr, '[MISSING_ENV_FILE]')
  ct.equal(fs.existsSync('.env'), false)
  ct.equal(fs.existsSync('.env.keys'), false)

  const created = execShellResult(`${dotenvx} encrypt --with ${publicKey}`)
  ct.equal(created.status, 0, created.stderr)
  const parsed = dotenv.parse(fs.readFileSync('.env'))
  ct.equal(parsed.DOTENV_PUBLIC_KEY, publicKey)
  ct.equal(decrypt(privateKey, parsed.HELLO), 'World')
  ct.equal(fs.existsSync('.env.keys'), false)
  ct.end()
})
