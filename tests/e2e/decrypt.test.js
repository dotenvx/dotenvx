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
  ct.equal(output.stderr, `◇ decrypted .env (${DOTENV_PUBLIC_KEY.slice(0, 3).toUpperCase()} ${DOTENV_PUBLIC_KEY.slice(3, 6).toUpperCase()}) via .env.keys ⛉`)

  execShell('rm .env.keys')

  // it can still get the values because they were decrypted
  const output2 = execShell(`${dotenvx} get`)
  ct.equal(output2, `{"DOTENV_PUBLIC_KEY":"${DOTENV_PUBLIC_KEY}","HELLO":"World"}`)

  ct.end()
})

for (const stdout of [false, true]) {
  t.test(`#decrypt${stdout ? ' --stdout' : ''} preserves literal dollars across repeated round trips`, ct => {
    fs.writeFileSync('.env', [
      String.raw`UNQUOTED=pa\$sword`,
      String.raw`DOUBLE="pa\$sword"`,
      String.raw`SINGLE='pa$sword'`,
      String.raw`SLASH=pa\\$sword`,
      String.raw`BACKSLASH=C:\tmp\\file`,
      String.raw`DUPLICATE=first\$value`,
      String.raw`DUPLICATE='second$value'`,
      ''
    ].join('\n'))
    const expected = {
      UNQUOTED: 'pa$sword',
      DOUBLE: 'pa$sword',
      SINGLE: 'pa$sword',
      SLASH: String.raw`pa\$sword`,
      BACKSLASH: String.raw`C:\tmp\\file`,
      DUPLICATE: 'second$value'
    }
    const env = { ...process.env, DOTENVX_CONFIG: path.join(tempDir, 'config') }
    const cli = (args) => {
      const result = spawnSync(node, [path.join(originalDir, 'src/cli/dotenvx.js'), ...args, '--no-native', '--no-armor'], { env, encoding: 'utf8' })
      ct.equal(result.status, 0, result.stderr)
      return result.stdout
    }
    const getValues = () => {
      const values = JSON.parse(cli(['get']))
      delete values.DOTENV_PUBLIC_KEY
      return values
    }

    for (let i = 0; i < 2; i++) {
      ct.same(getValues(), expected, 'plaintext values are preserved')
      cli(['encrypt'])
      ct.same(getValues(), expected, 'encrypted values are preserved')
      const encryptedSrc = fs.readFileSync('.env', 'utf8')
      const output = cli(stdout ? ['decrypt', '--stdout'] : ['decrypt'])
      if (stdout) {
        ct.equal(fs.readFileSync('.env', 'utf8'), encryptedSrc, '--stdout leaves the encrypted file unchanged')
        fs.writeFileSync('.env', output)
      }
      ct.same(getValues(), expected, 'decrypted values are preserved')
      const decryptedSrc = fs.readFileSync('.env', 'utf8')
      ct.match(decryptedSrc, String.raw`DUPLICATE=first\$value`, 'unquoted duplicate is escaped')
      ct.match(decryptedSrc, String.raw`DUPLICATE='second$value'`, 'single-quoted duplicate remains literal')
    }
    ct.end()
  })
}

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
  ct.match(stdout, /^○ no change to \.env \([0-9A-F]{3} [0-9A-F]{3}\) via source unknown\n$/)
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
  ct.match(stderr, '☠ [DECRYPTION_FAILED] could not decrypt FAKE. fix: [https://github.com/dotenvx/dotenvx/issues/757]\n')
  ct.match(stderr, /◇ decrypted \.env \([0-9A-F]{3} [0-9A-F]{3}\) via \.env.keys ⛉\n$/)
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
