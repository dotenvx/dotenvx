const t = require('tap')
const path = require('node:path')
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')
const { parseenvfile } = require('@dotenvx/primitives')
const readEnvspec = require('../../../src/lib/envspec/parsing/readEnvspec')
const cli = path.resolve('src/cli/dotenvx.js')

t.test('aliases normalize to canonical options and inherit across file blocks', ct => {
  for (const value of [true, false]) {
    ct.same(parseenvfile(`env "VALUE", redact: ${value}, encrypt: ${value}\n`), parseenvfile(`env "VALUE", redacted: ${value}, encrypted: ${value}\n`))
  }
  const cwd = ct.testdir({ Envfile: 'env "VALUE", redact: false, encrypted: false\nfile ".env.production" do\n env "VALUE", redacted: true, encrypt: true\nend\n' })
  const root = readEnvspec(path.join(cwd, 'Envfile'), [])
  ct.equal(root.redactionRules.get('VALUE'), false)
  ct.equal(root.encryptionRules.get('VALUE'), false)
  const production = readEnvspec(path.join(cwd, 'Envfile'), [path.join(cwd, '.env.production')])
  ct.equal(production.redactionRules.get('VALUE'), true)
  ct.equal(production.encryptionRules.get('VALUE'), true)
  ct.end()
})

t.test('aliases reject duplicate options, invalid booleans, and root modifiers', ct => {
  for (const [alias, canonical] of [['redact', 'redacted'], ['encrypt', 'encrypted']]) {
    for (const options of [
      `${alias}: false, ${canonical}: true`,
      `${canonical}: false, ${alias}: true`,
      `${alias}: false, ${canonical}: false`,
      `${alias}: true, ${alias}: true`
    ]) {
      ct.throws(() => parseenvfile(`env "VALUE", ${options}`), { message: `[MALFORMED_ENVSPEC] Duplicate Envfile option: ${canonical}` })
    }
    for (const value of ['"false"', '0', 'falseevil']) ct.throws(() => parseenvfile(`env "VALUE", ${alias}: ${value}`))
    ct.throws(() => parseenvfile(`${alias} false\nenv "VALUE"`))
    ct.throws(() => parseenvfile(`file ".env" do\n ${alias} false\nend`))
  }
  ct.end()
})

t.test('run, encrypt, check, and protect honor both aliases', ct => {
  const cwd = ct.testdir({
    Envfile: 'env "VISIBLE", redact: false, encrypt: false\nenv "HIDDEN", encrypt: false\nenv "SECRET", redact: true, encrypt: true\n',
    '.env': 'VISIBLE=public-value\nHIDDEN=hidden-plaintext\nSECRET=secret-value\n'
  })
  const invoke = (args, input) => spawnSync(process.execPath, [cli, ...args], {
    cwd,
    input,
    encoding: 'utf8',
    timeout: 10000,
    env: { PATH: process.env.PATH, CI: 'true', DOTENVX_NO_ARMOR: 'true', DOTENVX_CONFIG: cwd }
  })
  ct.equal(invoke(['check']).status, 1)
  const encrypted = invoke(['encrypt', '--no-native'])
  ct.equal(encrypted.status, 0, encrypted.stderr)
  const content = fs.readFileSync(path.join(cwd, '.env'), 'utf8')
  ct.match(content, 'VISIBLE=public-value')
  ct.match(content, 'HIDDEN=hidden-plaintext')
  ct.match(content, /SECRET=encrypted:/)
  ct.notMatch(content, 'secret-value')
  ct.equal(invoke(['check', '--no-native']).status, 0)
  const result = invoke(['run', '--strict', '--no-native', '--', process.execPath, '-e', 'console.log(process.env.VISIBLE, process.env.HIDDEN, process.env.SECRET)'])
  ct.equal(result.status, 0, result.stderr)
  ct.equal(result.stdout.trim(), 'public-value [REDACTED] [REDACTED]')
  const protectedFile = invoke(['protect', '--git-file', '.env'], content)
  ct.equal(protectedFile.status, 0, protectedFile.stderr)
  ct.equal(protectedFile.stdout, content)
  ct.equal(invoke(['protect', '--git-file', '.env'], 'SECRET=plaintext\n').status, 1)
  ct.end()
})
