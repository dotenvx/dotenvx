const t = require('tap')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const cli = path.resolve('src/cli/dotenvx.js')

function set (cwd, key, value, extra = []) {
  return spawnSync(process.execPath, [cli, 'set', key, value, '--no-armor', '--no-native', '--no-1password', '--no-bitwarden', ...extra], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: cwd, CI: 'true', DOTENVX_NO_ARMOR: 'true' }
  })
}

t.test('set obeys plaintext policy without creating keys or claiming encryption', t => {
  const dir = t.testdir({ Envfile: 'env "PORT", encrypted: false', '.env': 'PORT=3000\n' })
  const result = set(dir, 'PORT', '4000')
  t.equal(result.status, 0, result.stderr)
  t.match(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'PORT=4000')
  t.notOk(fs.existsSync(path.join(dir, '.env.keys')))
  t.notMatch(result.stdout, 'encrypted PORT')
  t.end()
})

t.test('policy overrides _PLAIN suffix and encrypts undeclared keys', t => {
  const dir = t.testdir({ Envfile: '', '.env': '' })
  for (const key of ['TOKEN_PLAIN', 'EXTRA']) {
    const result = set(dir, key, 'secret')
    t.equal(result.status, 0, result.stderr)
    t.match(fs.readFileSync(path.join(dir, '.env'), 'utf8'), `${key}="encrypted:`)
  }
  t.end()
})

t.test('explicit --plain cannot bypass required encryption', t => {
  const dir = t.testdir({ Envfile: 'env "TOKEN"', '.env': 'TOKEN=old\n' })
  const result = set(dir, 'TOKEN', 'secret', ['--plain'])
  t.equal(result.status, 1)
  t.match(result.stderr, 'requires encryption in Envfile')
  t.equal(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'TOKEN=old\n')
  t.notOk(fs.existsSync(path.join(dir, '.env.keys')))
  t.end()
})

t.test('set selects the target file policy', t => {
  const dir = t.testdir({ Envfile: 'env "PORT"\nfile ".env.development" do\n env "PORT", encrypted: false\nend', '.env.development': '' })
  const result = set(dir, 'PORT', '3000', ['-f', '.env.development'])
  t.equal(result.status, 0, result.stderr)
  t.match(fs.readFileSync(path.join(dir, '.env.development'), 'utf8'), 'PORT="3000"')
  t.notOk(fs.existsSync(path.join(dir, '.env.keys')))
  t.end()
})

t.test('malformed policy fails before modifying files', t => {
  const dir = t.testdir({ Envfile: 'unknown', '.env': 'TOKEN=old\n' })
  t.equal(set(dir, 'TOKEN', 'new').status, 1)
  t.equal(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'TOKEN=old\n')
  t.notOk(fs.existsSync(path.join(dir, '.env.keys')))
  t.end()
})

t.test('without Envfile legacy _PLAIN behavior remains', t => {
  const dir = t.testdir({ '.env': '' })
  t.equal(set(dir, 'TOKEN_PLAIN', 'value').status, 0)
  t.match(fs.readFileSync(path.join(dir, '.env'), 'utf8'), 'TOKEN_PLAIN="value"')
  t.end()
})
