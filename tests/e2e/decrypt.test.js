const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { which } = require('@dotenvx/tooling')
const { execSync, spawnSync } = require('child_process')

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

function execShellResult (commands) {
  const result = spawnSync(commands, {
    encoding: 'utf8',
    shell: true
  })

  return {
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    status: result.status
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

t.test('#decrypt', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)
  const DOTENV_PUBLIC_KEY = execShell(`${dotenvx} get DOTENV_PUBLIC_KEY`)

  const output = execShellResult(`${dotenvx} decrypt`)
  ct.equal(output.stdout, '')
  ct.equal(output.stderr, '◇ decrypted (.env)')

  execShell('rm .env.keys')

  // it can still get the values because they were decrypted
  const output2 = execShell(`${dotenvx} get`)
  ct.equal(output2, `{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"World"}`)

  ct.end()
})

t.test('#decrypt - missing DOTENV_PRIVATE_KEY', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)

  // rm .env.keys prior to running decrypt
  execShell('rm .env.keys')

  let stdout
  let stderr
  let exitCode
  try {
    execShell(`${dotenvx} decrypt`)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    stdout = error.stdout // capture output if there is any
    stderr = error.stderr // capture output if there is any
    exitCode = error.status // capture the exit code
  }

  ct.equal(exitCode, 1, 'should exit with code 1 when DOTENV_PRIVATE_KEY is missing')
  ct.equal(stdout, '○ no change (.env)\n')
  ct.equal(stderr, '☠ [DECRYPTION_FAILED] could not decrypt HELLO. fix: [https://github.com/dotenvx/dotenvx/issues/757]\n')

  ct.end()
})

t.test('#decrypt - partially decrypts when another encrypted value is bad', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)
  fs.appendFileSync(path.join(tempDir, '.env'), 'FAKE="encrypted:fake123345343434"\n')

  let stdout
  let stderr
  let exitCode
  try {
    execShell(`${dotenvx} decrypt`)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    stdout = error.stdout
    stderr = error.stderr
    exitCode = error.status
  }

  const envSrc = fs.readFileSync(path.join(tempDir, '.env'), 'utf8')

  ct.equal(exitCode, 1, 'should exit with code 1 when one encrypted value cannot be decrypted')
  ct.equal(stdout, '')
  ct.equal(stderr, '☠ [DECRYPTION_FAILED] could not decrypt FAKE. fix: [https://github.com/dotenvx/dotenvx/issues/757]\n◇ decrypted (.env)\n')
  ct.match(envSrc, /HELLO=World/)
  ct.match(envSrc, /FAKE="encrypted:fake123345343434"/)

  ct.end()
})

t.test('#decrypt --stdout', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)
  const DOTENV_PUBLIC_KEY = execShell(`${dotenvx} get DOTENV_PUBLIC_KEY`)

  execShell(`${dotenvx} decrypt --stdout > filename.txt`)

  ct.equal(fs.readFileSync(path.join(tempDir, 'filename.txt'), { encoding: 'utf8' }), `#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="${DOTENV_PUBLIC_KEY}"

# .env
HELLO=World\n\n`)

  ct.end()
})

t.test('#decrypt --stdout - missing DOTENV_PRIVATE_KEY', ct => {
  execShell(`
    echo "HELLO=World" > .env
  `)

  execShell(`${dotenvx} encrypt`)

  // rm .env.keys prior to running decrypt
  execShell('rm .env.keys')

  let stderr
  let exitCode
  try {
    execShell(`${dotenvx} decrypt --stdout > filename.txt`)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    stderr = error.stderr // capture stderr if there is any
    exitCode = error.status // capture the exit code
  }

  ct.equal(exitCode, 1, 'should exit with code 1 when DOTENV_PRIVATE_KEY is missing')
  ct.equal(stderr, '☠ [DECRYPTION_FAILED] could not decrypt HELLO. fix: [https://github.com/dotenvx/dotenvx/issues/757]\n')

  ct.end()
})

for (const stdout of [false, true]) {
  for (const keySource of ['file', 'environment']) {
    t.test(`#decrypt${stdout ? ' --stdout' : ''} preserves file values with a ${keySource} private key`, ct => {
      fs.writeFileSync('.env', 'KEY=first\nKEY=second\nVISIBLE_PLAIN=original\n')
      execShell(`${dotenvx} encrypt`)
      const encryptedSrc = fs.readFileSync('.env', 'utf8')
      const env = {
        ...process.env,
        DOTENVX_CONFIG: path.join(tempDir, 'config'),
        KEY: 'shell',
        VISIBLE_PLAIN: 'shell'
      }
      if (keySource === 'environment') {
        const { scan } = require('@dotenvx/primitives')
        env.DOTENV_PRIVATE_KEY = scan(fs.readFileSync('.env.keys', 'utf8')).parsed.DOTENV_PRIVATE_KEY[0]
        fs.unlinkSync('.env.keys')
      }

      const args = [path.join(originalDir, 'src/cli/dotenvx.js'), 'decrypt', '--no-native', '--no-armor']
      if (stdout) args.push('--stdout')
      const result = spawnSync(node, args, { env, encoding: 'utf8' })
      const decryptedSrc = stdout ? result.stdout : fs.readFileSync('.env', 'utf8')

      ct.equal(result.status, 0, result.stderr)
      ct.match(decryptedSrc, /^KEY=first\nKEY=second$/m, 'each duplicate assignment is decrypted from the file')
      ct.match(decryptedSrc, /^VISIBLE_PLAIN=original$/m, 'plaintext file values are preserved too')
      if (stdout) ct.equal(fs.readFileSync('.env', 'utf8'), encryptedSrc, '--stdout leaves the file encrypted')
      ct.end()
    })
  }
}

t.test('#decrypt --stdout respects key selection despite shell overrides', ct => {
  fs.writeFileSync('.env', 'KEY=file\nOTHER=unchanged\n')
  execShell(`${dotenvx} encrypt`)
  const encryptedSrc = fs.readFileSync('.env', 'utf8')
  const other = encryptedSrc.match(/^OTHER=.*$/m)[0]
  const result = spawnSync(node, [
    path.join(originalDir, 'src/cli/dotenvx.js'), 'decrypt', '--stdout', '--key', 'KEY', '--no-native', '--no-armor'
  ], {
    env: { ...process.env, DOTENVX_CONFIG: path.join(tempDir, 'config'), KEY: 'shell', OTHER: 'shell' },
    encoding: 'utf8'
  })

  ct.equal(result.status, 0, result.stderr)
  ct.match(result.stdout, /^KEY=file$/m)
  ct.ok(result.stdout.includes(other), 'unselected ciphertext is preserved')
  ct.equal(fs.readFileSync('.env', 'utf8'), encryptedSrc)
  ct.end()
})

t.test('#decrypt --stdout reports missing private keys despite shell overrides', ct => {
  fs.writeFileSync('.env', 'KEY=file\n')
  execShell(`${dotenvx} encrypt`)
  fs.unlinkSync('.env.keys')
  const result = spawnSync(node, [
    path.join(originalDir, 'src/cli/dotenvx.js'), 'decrypt', '--stdout', '--no-native', '--no-armor'
  ], {
    env: { ...process.env, DOTENVX_CONFIG: path.join(tempDir, 'config'), KEY: 'shell' },
    encoding: 'utf8'
  })

  ct.equal(result.status, 1)
  ct.match(result.stderr, /DECRYPTION_FAILED/)
  ct.end()
})
