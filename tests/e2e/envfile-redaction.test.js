const t = require('tap')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const init = require('../../src/lib/services/init')
const readEnvfile = require('../../src/lib/envfile/parsing/readEnvfile')
const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')

function directory (ct) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'envfile-redaction-'))
  ct.teardown(() => fs.rmSync(cwd, { recursive: true, force: true }))
  return cwd
}

function run (cwd, args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, DOTENVX_NO_ARMOR: 'true', DOTENVX_CONFIG: cwd },
    encoding: 'utf8',
    timeout: 10000
  })
}

t.test('init defaults to redaction and uses Varlock public naming conventions', ct => {
  const cwd = directory(ct)
  const publicKeys = ['VISIBLE_PLAIN', 'PUBLIC_URL', 'PUBLIC', 'PUBLICATION', 'VITE_TOKEN', 'VITE', 'VITETOKEN', 'NEXT_PUBLIC_URL', 'NUXT_PUBLIC_TOKEN', 'REPUBLIC_TOKEN', 'TOKEN_PUBLIC_SUFFIX', 'PUBLIC_KEY_SECRET']
  const privateKeys = ['BASE_URL', 'TOKEN_SECRET', 'public_token', 'vite_token', 'visible_plain', 'MY_VITE_TOKEN']
  const keys = [...publicKeys, ...privateKeys]
  fs.writeFileSync(path.join(cwd, '.env.development'), keys.map(key => `${key}=example-value`).join('\n'))
  init({ directory: cwd, envFiles: ['.env.development'], sourceKeys: ['NEXT_PUBLIC_CODE', 'NUXT_PUBLIC_CODE', 'VITE_CODE', 'CODE_PUBLIC_VALUE', 'CODE_SECRET'] })
  const source = fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8')
  ct.match(source, /^redacted true\nencrypted false\n/)
  const schema = readEnvfile(path.join(cwd, 'Envfile'), [path.join(cwd, '.env.development')])
  for (const name of keys) {
    ct.equal(schema.redactionRules.get(name), !publicKeys.includes(name), name)
  }
  for (const name of ['NEXT_PUBLIC_CODE', 'NUXT_PUBLIC_CODE', 'VITE_CODE', 'CODE_PUBLIC_VALUE']) {
    ct.equal(schema.redactionRules.get(name), false, `source-only ${name} uses the same inference`)
  }
  ct.equal(schema.redactionRules.get('CODE_SECRET'), true)
  ct.equal(init({ directory: cwd }).created, false, 'existing user settings are preserved')
  ct.end()
})

t.test('root, file and field redaction rules inherit and reject duplicate defaults', ct => {
  const cwd = directory(ct)
  const filename = path.join(cwd, 'Envfile')
  fs.writeFileSync(filename, 'encrypted false\nredacted true\nenv "SHARED"\nfile ".env.dev" do\n  redacted false\n  env "SECRET", redacted: true\nend\n')
  const schema = readEnvfile(filename, [path.join(cwd, '.env.dev')])
  ct.equal(schema.redactionRules.get('SHARED'), false)
  ct.equal(schema.redactionRules.get('SECRET'), true)
  fs.writeFileSync(filename, 'redacted true\nredacted false\n')
  ct.throws(() => readEnvfile(filename), /Duplicate Envfile default/)
  fs.writeFileSync(filename, 'encrypted false\nenv "LEGACY"\n')
  ct.equal(readEnvfile(filename).redactionRules.get('LEGACY'), true, 'older Envfiles default to redacted')
  ct.end()
})

t.test('run redacts output automatically and check reports only the result', ct => {
  const cwd = directory(ct)
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=hidden-test-value\nURL=https://example.test\nFORCED_PLAIN=also-hidden-value\n')
  fs.writeFileSync(path.join(cwd, 'Envfile'), 'redacted true\nenv "SECRET"\nenv "URL", redacted: false\nenv "FORCED_PLAIN", redacted: true\n')
  const result = run(cwd, ['run', '--', process.execPath, '-e', 'console.log(process.env.SECRET, process.env.URL, process.env.FORCED_PLAIN); console.error(process.env.SECRET)'])
  ct.equal(result.status, 0, result.stderr)
  ct.equal(result.stdout, '[REDACTED] https://example.test [REDACTED]\n')
  ct.notMatch(result.stderr, /hidden-test-value/)
  const check = run(cwd, ['check'])
  ct.equal(check.status, 0, check.stderr)
  const output = check.stdout + check.stderr
  ct.equal(check.stdout, '')
  ct.match(check.stderr, /▣ valid \(.env\)/)
  ct.notMatch(output, /encrypted:|redacted:/)
  ct.notMatch(output, /hidden-test-value|https:\/\/example.test/)
  ct.end()
})

t.test('redaction does not replace encryption enforcement', ct => {
  const cwd = directory(ct)
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=plaintext-test-value\n')
  fs.writeFileSync(path.join(cwd, 'Envfile'), 'redacted true\nenv "SECRET", encrypted: true\n')
  const result = run(cwd, ['run', '--', process.execPath, '-e', 'console.log("started")'])
  ct.equal(result.status, 1)
  ct.match(result.stderr, /SECRET is not encrypted/)
  ct.notMatch(result.stdout, /started/)
  ct.end()
})

t.test('selected policies keep redaction if either requires it', ct => {
  const cwd = directory(ct)
  const filename = path.join(cwd, 'Envfile')
  fs.writeFileSync(filename, 'redacted true\nfile ".env.a" do\n  env "SHARED", redacted: false\nend\nfile ".env.b" do\n  env "SHARED"\nend\n')
  for (const files of [['.env.a', '.env.b'], ['.env.b', '.env.a']]) {
    const schema = readEnvfile(filename, files.map(file => path.join(cwd, file)))
    ct.equal(schema.redactionRules.get('SHARED'), true)
  }
  ct.end()
})

t.test('declared shell-only values are redacted and a root opt-out is honored', ct => {
  const cwd = directory(ct)
  fs.writeFileSync(path.join(cwd, '.env'), '')
  fs.writeFileSync(path.join(cwd, 'Envfile'), 'redacted true\nenv "SHELL_SECRET"\n')
  const invoke = () => spawnSync(process.execPath, [cli, 'run', '--', process.execPath, '-e', 'console.log(process.env.SHELL_SECRET)'], {
    cwd,
    env: { ...process.env, SHELL_SECRET: 'shell-test-secret', DOTENVX_NO_ARMOR: 'true', DOTENVX_CONFIG: cwd },
    encoding: 'utf8',
    timeout: 10000
  })
  const redacted = invoke()
  ct.equal(redacted.status, 0)
  ct.equal(redacted.stdout, '[REDACTED]\n')
  fs.writeFileSync(path.join(cwd, 'Envfile'), 'redacted false\nenv "SHELL_SECRET"\n')
  const visible = invoke()
  ct.equal(visible.status, 0)
  ct.equal(visible.stdout, 'shell-test-secret\n')
  ct.end()
})

t.test('removed --redact flag is rejected and absent from help', ct => {
  const cwd = directory(ct)
  for (const hasEnvfile of [false, true]) {
    if (hasEnvfile) fs.writeFileSync(path.join(cwd, 'Envfile'), 'redacted true\n')
    const result = run(cwd, ['run', '--redact', '--', process.execPath, '-e', 'console.log("started")'])
    ct.equal(result.status, 1)
    ct.match(result.stderr, /unknown option.*--redact/)
    ct.notMatch(result.stdout, /started/)
  }
  const help = run(cwd, ['run', '--help'])
  ct.equal(help.status, 0)
  ct.notMatch(help.stdout, /--redact/)
  ct.end()
})

t.test('run without an Envfile leaves output unchanged', ct => {
  const cwd = directory(ct)
  fs.writeFileSync(path.join(cwd, '.env'), 'SECRET=unredacted-test-value\n')
  const result = run(cwd, ['run', '--', process.execPath, '-e', 'console.log(process.env.SECRET); console.error(process.env.SECRET)'])
  ct.equal(result.status, 0)
  ct.equal(result.stdout, 'unredacted-test-value\n')
  ct.match(result.stderr, /unredacted-test-value/)
  ct.end()
})
