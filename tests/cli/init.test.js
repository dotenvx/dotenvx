const t = require('tap')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const readEnvfile = require('../../src/lib/helpers/readEnvfile')
const parser = require('../../src/lib/helpers/envfileParser')

const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
function run (cwd, args = []) {
  return spawnSync(process.execPath, [cli, 'init', ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, DOTENVX_NO_ARMOR: 'true' }
  })
}

t.test('merges both inputs, copies unique names only, and generates valid rules', ct => {
  const cwd = ct.testdir({
    '.env.example': 'export API_KEY=secret-marker\nPORT=3000\nAPI_KEY=second-secret\n',
    '.env': 'OTHER=actual-secret\nPORT=4000\n'
  })
  const result = run(cwd)
  ct.equal(result.status, 0, result.stderr)
  ct.match(result.stdout + result.stderr, 'from .env.example, .env (3 variables)')
  ct.match(result.stdout, 'dotenvx validate')
  ct.match(result.stdout, 'automatically validates')
  const content = fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8')
  ct.same(readEnvfile(path.join(cwd, 'Envfile')).requiredKeys, ['API_KEY', 'PORT', 'OTHER'])
  ct.match(content, /^encrypted false\n\n/)
  ct.notMatch(content, /secret-marker|second-secret|actual-secret/)
  ct.ok(content.indexOf('env "PORT"') < content.indexOf('# Required by default'))
  ct.equal(fs.readFileSync(path.join(cwd, '.env'), 'utf8'), 'OTHER=actual-secret\nPORT=4000\n')

  // The reference must remain executable documentation when uncommented.
  const reference = content.slice(content.indexOf('# Required by default'))
  const snippets = reference.split('\n').filter(line => /^# (?:encrypted |env |file | {2}|end$)/.test(line)).map(line => line.slice(2))
  // Validate independently because examples intentionally reuse variable names.
  for (const line of snippets.filter(line => /^(env |encrypted )/.test(line))) {
    const filename = path.join(cwd, 'Example')
    fs.writeFileSync(filename, line + '\n')
    ct.doesNotThrow(() => readEnvfile(filename), line)
  }
  const block = snippets.slice(snippets.findIndex(line => line.startsWith('file ')))
  ct.doesNotThrow(() => parser.parse(block.join('\n') + '\n'), 'file block example parses')
  ct.end()
})

t.test('reads .env alone without resolving references or encrypted values', ct => {
  const cwd = ct.testdir({ '.env': 'SECRET=encrypted:not-real\nPASSWORD=op://vault/item/password\nEXEC=$(touch should-not-exist)\nDOTENV_PUBLIC_KEY=public\nDOTENV_PRIVATE_KEY_PRODUCTION=private\n' })
  const result = run(cwd)
  ct.equal(result.status, 0, result.stderr)
  ct.same(readEnvfile(path.join(cwd, 'Envfile')).requiredKeys, ['SECRET', 'PASSWORD', 'EXEC'])
  ct.match(fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8'), /^encrypted true\n\n/)
  ct.notOk(fs.existsSync(path.join(cwd, 'should-not-exist')))
  ct.notMatch(fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8'), /op:\/\/|encrypted:not-real|=private/)
  ct.end()
})

t.test('explicit input and missing explicit input', ct => {
  const cwd = ct.testdir({ '.env.example': 'DEFAULT=encrypted:example', '.env': 'OTHER=encrypted:local', 'custom env': 'CUSTOM=2' })
  const missing = run(cwd, ['-f', 'missing'])
  ct.equal(missing.status, 1)
  ct.notOk(fs.existsSync(path.join(cwd, 'Envfile')))
  const result = run(cwd, ['-f', 'custom env'])
  ct.equal(result.status, 0, result.stderr)
  ct.same(readEnvfile(path.join(cwd, 'Envfile')).requiredKeys, ['CUSTOM'])
  ct.match(fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8'), /^encrypted false\n/)
  ct.end()
})

t.test('encryption in either file is detected even in an earlier duplicate assignment', ct => {
  for (const source of ['.env.example', '.env']) {
    const inputs = { '.env.example': 'SHARED=\n', '.env': 'SHARED=plain\n' }
    inputs[source] = 'SHARED="encrypted:test-ciphertext"\nSHARED=plain\n'
    const cwd = ct.testdir(inputs, source === '.env' ? 'local-encrypted' : 'example-encrypted')
    const result = run(cwd)
    ct.equal(result.status, 0, result.stderr)
    const content = fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8')
    ct.match(content, /^encrypted true\n\nenv "SHARED"\n/)
    ct.same(readEnvfile(path.join(cwd, 'Envfile')).encryptedKeys, ['SHARED'])
    ct.notMatch(content, 'test-ciphertext')
  }
  ct.end()
})

t.test('starter and repeat invocation preserve user edits', ct => {
  const cwd = ct.testdir({})
  ct.equal(run(cwd).status, 0)
  ct.same(readEnvfile(path.join(cwd, 'Envfile')).requiredKeys, [])
  ct.match(fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8'), /^encrypted false\n/)
  fs.writeFileSync(path.join(cwd, 'Envfile'), '# user edits\n')
  const repeat = run(cwd, ['-f', 'missing'])
  ct.equal(repeat.status, 0)
  ct.match(repeat.stdout, 'already exists (unchanged)')
  ct.equal(fs.readFileSync(path.join(cwd, 'Envfile'), 'utf8'), '# user edits\n')
  ct.end()
})

t.test('unsupported names do not create an invalid Envfile', ct => {
  const cwd = ct.testdir({ '.env': 'BAD.KEY=secret-marker' })
  const result = run(cwd)
  ct.equal(result.status, 1)
  ct.match(result.stderr, 'Unsupported Envfile variable names: BAD.KEY')
  ct.notMatch(result.stderr, 'secret-marker')
  ct.notOk(fs.existsSync(path.join(cwd, 'Envfile')))
  ct.end()
})

t.test('init is discoverable and quiet mode is respected', ct => {
  const cwd = ct.testdir({})
  const help = run(cwd, ['--help'])
  ct.match(help.stdout + help.stderr, '--file')
  const result = run(cwd, ['--quiet'])
  ct.equal(result.status, 0)
  ct.equal(result.stdout, '')
  ct.ok(fs.existsSync(path.join(cwd, 'Envfile')))
  ct.end()
})

t.test('generated rules validate and stop run when a required value is absent', ct => {
  const cwd = ct.testdir({ '.env.example': 'INIT_TEST_REQUIRED=\n', '.env': 'INIT_TEST_REQUIRED=present\n' })
  ct.equal(run(cwd).status, 0)
  const env = { ...process.env, DOTENVX_NO_ARMOR: 'true' }
  delete env.INIT_TEST_REQUIRED
  const invoke = args => spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: 'utf8' })
  ct.equal(invoke(['validate']).status, 0)
  fs.writeFileSync(path.join(cwd, '.env'), '')
  const validation = invoke(['validate'])
  ct.equal(validation.status, 1)
  ct.match(validation.stderr, 'INIT_TEST_REQUIRED is required')
  const execution = invoke(['run', '--', process.execPath, '-e', 'console.log("CHILD_STARTED")'])
  ct.equal(execution.status, 1)
  ct.notMatch(execution.stdout, 'CHILD_STARTED')
  ct.end()
})
