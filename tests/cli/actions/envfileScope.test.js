const t = require('tap')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { keypair, encrypt } = require('@dotenvx/primitives')
const cli = path.resolve('src/cli/dotenvx.js')
const main = path.resolve('src/lib/main.js')

function run (cwd, args, env = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: cwd, CI: 'true', DOTENVX_NO_ARMOR: 'true', ...env }
  })
}

t.test('run checks final layered values and launches without proxy setup', t => {
  const dir = t.testdir({
    Envfile: 'strict true\nenv "PORT", type: "port", encrypted: false, redacted: false',
    '.env': 'PORT=3000\n',
    '.env.local': 'PORT=4000\n'
  })
  const result = run(dir, ['run', '--no-native', '-f', '.env.local', '-f', '.env', '--', process.execPath, '-e', 'if (process.env.PORT !== "4000" || process.env.DOTENVX_PROXY_URL) process.exit(2)'])
  t.equal(result.status, 0, result.stderr)
  const invalid = run(dir, ['run', '--no-native', '--', process.execPath, '-e', 'console.log("LAUNCHED")'], { PORT: '70000' })
  t.equal(invalid.status, 1)
  t.notMatch(invalid.stdout, 'LAUNCHED')
  t.match(invalid.stderr, 'PORT must be at most 65535')
  t.end()
})

t.test('check reports violations in its preview', t => {
  const dir = t.testdir({ Envfile: 'env "PORT", type: "port", encrypted: false, redacted: false', '.env': 'PORT=70000' })
  const result = run(dir, ['check', '--no-native'])
  t.equal(result.status, 1)
  t.match(result.stdout + result.stderr, '!port')
  t.end()
})

t.test('removed proxy declarations block run, check, config and encrypt before side effects', t => {
  for (const declaration of ['env "TOKEN", proxy: false', 'env "TOKEN", proxy: { domain: "api.example.com" }']) {
    const dir = t.testdir({ Envfile: `file ".env.unselected" do\n${declaration}\nend`, '.env': 'TOKEN=unchanged\n' })
    for (const args of [
      ['run', '--no-native', '--', process.execPath, '-e', 'console.log("LAUNCHED")'],
      ['check', '--no-native'],
      ['encrypt', '--no-armor', '--no-native']
    ]) {
      const result = run(dir, args)
      t.equal(result.status, 1)
      t.match(result.stderr, 'MALFORMED_ENVFILE')
      t.notMatch(result.stdout, 'LAUNCHED')
    }
    const config = spawnSync(process.execPath, ['-e', `try { require(${JSON.stringify(main)}).config({ processEnv: {}, noArmor: true, noNative: true }) } catch (e) { if (e.code === 'MALFORMED_ENVFILE') process.exit(17); throw e }`], { cwd: dir, encoding: 'utf8' })
    t.equal(config.status, 17, config.stderr)
    t.equal(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'TOKEN=unchanged\n')
    t.notOk(fs.existsSync(path.join(dir, '.env.keys')))
  }
  t.end()
})

t.test('decryption and child-output redaction still work without proxy runtime', t => {
  const kp = keypair()
  const dir = t.testdir({ Envfile: 'strict true\nenv "TOKEN"', '.env': `DOTENV_PUBLIC_KEY=${kp.publicKey}\nTOKEN=${encrypt(kp.publicKey, 'scope-secret')}\n` })
  const result = run(dir, ['run', '--no-native', '--', process.execPath, '-e', 'if (process.env.TOKEN !== "scope-secret") process.exit(2); console.log(process.env.TOKEN)'], { DOTENV_PRIVATE_KEY: kp.privateKey })
  t.equal(result.status, 0, result.stderr)
  t.notMatch(result.stdout + result.stderr, 'scope-secret')
  t.end()
})
