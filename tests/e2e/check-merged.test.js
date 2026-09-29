const t = require('tap')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')

function setup (ct, schema, files = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-check-'))
  ct.teardown(() => fs.rmSync(cwd, { recursive: true, force: true }))
  fs.writeFileSync(path.join(cwd, 'Envfile'), schema)
  for (const [file, contents] of Object.entries(files)) fs.writeFileSync(path.join(cwd, file), contents)
  return (args = [], overrides = {}, command = 'check') => {
    const env = { ...process.env }
    for (const key of Object.keys(env)) {
      if (/^DOTENV/.test(key) || ['CHECK_SHARED', 'CHECK_ONLY_DEV', 'CHECK_PORT'].includes(key)) delete env[key]
    }
    return spawnSync(process.execPath, [cli, command, ...args, ...(command === 'run' ? ['--', process.execPath, '-e', 'process.exit(0)'] : [])], {
      cwd,
      env: { ...env, DOTENVX_NO_ARMOR: 'true', DOTENVX_CONFIG: cwd, CI: 'true', ...overrides },
      encoding: 'utf8',
      timeout: 10000
    })
  }
}

const schema = 'redacted true\nenv "CHECK_SHARED"\nfile ".env.development" do\n  env "CHECK_ONLY_DEV"\nend\nfile ".env.production" do\nend\n'

t.test('defaults to .env without loading files named in policy blocks', ct => {
  const check = setup(ct, schema, {
    '.env': 'CHECK_SHARED=default\n',
    '.env.development': 'CHECK_SHARED=dev\nCHECK_ONLY_DEV=dev-only\n'
  })
  const result = check()
  ct.equal(result.status, 0, result.stderr)
  ct.equal(result.stdout, '')
  ct.match(result.stderr, /valid \(.env\)/)
  ct.notMatch(result.stderr, /development|production|dev-only|checking|redacted:/)
  ct.end()
})

t.test('merges partial files before applying selected file policies', ct => {
  const check = setup(ct, schema, {
    '.env.development': 'CHECK_ONLY_DEV=dev-only\n',
    '.env.production': 'CHECK_SHARED=shared\n'
  })
  for (const args of [['-f', '.env.development', '-f', '.env.production'], ['-f', '.env.production', '-f', '.env.development']]) {
    const result = check(args)
    ct.equal(result.status, 0, result.stderr)
    ct.match(result.stderr, /valid \(/)
  }
  const alone = check(['-f', '.env.development'])
  ct.equal(alone.status, 1)
  ct.match(alone.stderr, /CHECK_SHARED required/)
  ct.end()
})

t.test('missing layers are skipped unless strict, and missing values still fail', ct => {
  const check = setup(ct, schema, { '.env.development': 'CHECK_SHARED=dev\nCHECK_ONLY_DEV=dev-only\n' })
  const args = ['-f', '.env.development', '-f', '.env.production']
  const result = check(args)
  ct.equal(result.status, 0, result.stderr)
  ct.match(result.stderr, /○ skipped \(.env.production\)/)
  ct.match(result.stderr, /valid \(.env.development\)/)
  const strict = check([...args, '--strict'])
  ct.equal(strict.status, 1)
  ct.match(strict.stderr, /MISSING_ENV_FILE/)
  const ignored = check([...args, '--strict', '--ignore=MISSING_ENV_FILE'])
  ct.equal(ignored.status, 0)
  const empty = setup(ct, 'env "CHECK_SHARED"\n')()
  ct.equal(empty.status, 1)
  ct.match(empty.stderr, /CHECK_SHARED required/)
  ct.end()
})

t.test('individual diagnostics use assignment lines, including multiline and duplicate keys', ct => {
  const check = setup(ct, 'env "CHECK_PORT", type: "port"\nenv "CHECK_SHARED", encrypted: true\n', {
    '.env': '# heading\r\nMULTILINE="one\r\nCHECK_PORT=inside\r\n"\r\nCHECK_PORT=20\r\nCHECK_PORT=bad\r\nCHECK_SHARED=plaintext\r\n'
  })
  const result = check()
  ct.equal(result.status, 1)
  ct.match(result.stderr, /CHECK_PORT must be an integer \(\.env:6\)/)
  ct.match(result.stderr, /☠ CHECK_SHARED not encrypted \(\.env:7\)/)
  ct.notMatch(result.stderr, /plaintext|; CHECK/)
  ct.equal(result.stdout, '')
  const shell = check([], { CHECK_PORT: 'invalid-shell-port' })
  ct.match(shell.stderr, /CHECK_PORT must be an integer \(shell environment\)/)
  const inline = check(['-e', 'CHECK_PORT=invalid-inline', '--overload'])
  ct.match(inline.stderr, /CHECK_PORT must be an integer \(--env:1\)/)
  ct.end()
})

t.test('explicit paths and DOTENV_FILE select files', ct => {
  const check = setup(ct, schema, { '.env.custom': 'CHECK_SHARED=custom\n' })
  for (const result of [check(['-f', '.env.custom']), check([], { DOTENV_FILE: '.env.custom' })]) {
    ct.equal(result.status, 0, result.stderr)
    ct.match(result.stderr, /valid \(.env.custom\)/)
    ct.notMatch(result.stderr, /skipped/)
  }
  ct.end()
})

t.test('check and run agree on file precedence, overload, and shell overrides', ct => {
  const invoke = setup(ct, 'env "CHECK_PORT", type: "port"\n', {
    '.env': 'CHECK_PORT=4000\n',
    '.env.local': 'CHECK_PORT=bad\n'
  })
  for (const [args, overrides, status] of [
    [['-f', '.env', '-f', '.env.local'], {}, 0],
    [['-f', '.env', '-f', '.env.local', '--overload'], {}, 1],
    [['-f', '.env.local', '-f', '.env'], {}, 1],
    [['-f', '.env.local', '-f', '.env', '--overload'], {}, 0],
    [['-f', '.env'], { CHECK_PORT: 'bad-shell' }, 1],
    [['-f', '.env', '--overload'], { CHECK_PORT: 'bad-shell' }, 0]
  ]) {
    const check = invoke(args, overrides)
    const run = invoke(args, overrides, 'run')
    ct.equal(check.status, status, check.stderr)
    ct.equal(check.status, run.status, 'check and run agree')
    if (args.includes('--overload') && status === 1) ct.match(check.stderr, /CHECK_PORT must be an integer \(\.env.local:1\)/)
  }
  ct.end()
})

t.test('encryption validation follows the winning source, just as run does', ct => {
  const { encrypt } = require('@dotenvx/primitives')
  const publicKey = '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
  const privateKey = '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'
  const invoke = setup(ct, 'env "CHECK_SHARED", encrypted: true\n', {
    '.env': 'CHECK_SHARED=plaintext\n',
    '.env.encrypted': `CHECK_SHARED="${encrypt(publicKey, 'test-secret')}"\n`
  })
  for (const [args, status] of [
    [['-f', '.env', '-f', '.env.encrypted'], 1],
    [['-f', '.env', '-f', '.env.encrypted', '--overload'], 0],
    [['-f', '.env.encrypted', '-f', '.env'], 0],
    [['-f', '.env.encrypted', '-f', '.env', '--overload'], 1]
  ]) {
    const overrides = { DOTENV_PRIVATE_KEY_ENCRYPTED: privateKey }
    const check = invoke(args, overrides)
    ct.equal(check.status, status, check.stderr)
    ct.equal(check.status, invoke(args, overrides, 'run').status, 'check and run agree')
    if (status === 1) ct.match(check.stderr, /CHECK_SHARED not encrypted \(\.env:1\)/)
  }
  ct.end()
})

t.test('conventions merge layers and shell-only values can satisfy the schema', ct => {
  const invoke = setup(ct, 'env "CHECK_SHARED"\nenv "CHECK_PORT", type: "port"\n', {
    '.env': 'CHECK_SHARED=shared\n',
    '.env.development': 'CHECK_PORT=3000\n'
  })
  const options = { NODE_ENV: 'development' }
  const check = invoke(['--convention', 'nextjs'], options)
  ct.equal(check.status, 0, check.stderr)
  ct.equal(invoke(['--convention', 'nextjs'], options, 'run').status, check.status)
  const shell = setup(ct, 'env "CHECK_SHARED"\n')([], { CHECK_SHARED: 'shell-value' })
  ct.equal(shell.status, 0, shell.stderr)
  ct.match(shell.stderr, /valid \(shell environment\)/)
  ct.end()
})
