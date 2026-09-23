const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
const privateKey = '0'.repeat(63) + '1'
const publicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

t.test('standalone key primitives', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-primitives-'))
  t.teardown(() => fs.rmSync(cwd, { recursive: true, force: true }))
  const invoke = (args, input) => spawnSync(process.execPath, [cli, 'primitives', ...args], {
    cwd,
    encoding: 'utf8',
    input,
    timeout: 10000,
    env: { ...process.env, DOTENV_PRIVATE_KEY: 'invalid', DOTENVX_NO_ARMOR: 'true' }
  })
  const run = (...args) => invoke(args)

  const generated = run('keypair')
  t.equal(generated.status, 0)
  t.equal(generated.stderr, '')
  const pair = JSON.parse(generated.stdout)
  t.match(pair.privateKey, /^[a-f0-9]{64}$/)
  t.match(pair.publicKey, /^(02|03)[a-f0-9]{64}$/)
  t.equal(run('derive', pair.privateKey).stdout, pair.publicKey + '\n')
  t.same(JSON.parse(run('keypair', pair.privateKey).stdout), pair)
  t.same(fs.readdirSync(cwd), [], 'does not create env or key files')

  fs.writeFileSync(path.join(cwd, '.env'), 'DOTENV_PUBLIC_KEY=unrelated\n')
  fs.writeFileSync(path.join(cwd, '.env.keys'), 'DOTENV_PRIVATE_KEY=invalid\n')
  const restored = run('keypair', privateKey)
  t.equal(restored.status, 0)
  t.equal(restored.stderr, '')
  t.same(JSON.parse(restored.stdout), { privateKey, publicKey })
  const derived = run('derive', privateKey)
  t.equal(derived.status, 0)
  t.equal(derived.stderr, '')
  t.equal(derived.stdout, publicKey + '\n')

  for (const command of ['keypair', 'derive']) {
    for (const input of [privateKey, ` \t${privateKey}\r\n`]) {
      const result = invoke([command, '--stdin'], input)
      t.equal(result.status, 0, `${command} accepts stdin with optional surrounding whitespace`)
      t.equal(result.stderr, '')
      if (command === 'keypair') t.same(JSON.parse(result.stdout), { privateKey, publicKey })
      else t.equal(result.stdout, publicKey + '\n')
    }
    for (const input of ['', ' \r\n\t', 'invalid', `${privateKey}\n${privateKey}`, `${privateKey}junk`, '0'.repeat(64)]) {
      const result = invoke([command, '--stdin'], input)
      t.equal(result.status, 1, `${command} rejects empty or invalid stdin`)
      t.equal(result.stdout, '')
      t.ok(result.stderr)
    }
    const conflict = invoke([command, privateKey, '--stdin'], privateKey)
    t.equal(conflict.status, 1)
    t.equal(conflict.stdout, '')
    t.match(conflict.stderr, /Cannot combine/)
  }

  const pipedGeneration = invoke(['keypair'], privateKey)
  t.equal(pipedGeneration.status, 0)
  t.not(JSON.parse(pipedGeneration.stdout).privateKey, privateKey, 'keypair does not implicitly read stdin')
  const pipedDerivation = invoke(['derive'], privateKey)
  t.equal(pipedDerivation.status, 1, 'derive requires an explicit input source')
  t.equal(pipedDerivation.stdout, '')
  t.equal(fs.readFileSync(path.join(cwd, '.env'), 'utf8'), 'DOTENV_PUBLIC_KEY=unrelated\n')
  t.equal(fs.readFileSync(path.join(cwd, '.env.keys'), 'utf8'), 'DOTENV_PRIVATE_KEY=invalid\n')

  for (const args of [['derive'], ['derive', ''], ['keypair', ''], ['derive', 'invalid'], ['keypair', 'invalid'], ['keypair', '--public'], ['keypair', privateKey, 'extra'], ['derive', privateKey, 'extra']]) {
    const result = run(...args)
    t.equal(result.status, 1, `${args[0]} rejects invalid arguments`)
    t.equal(result.stdout, '', 'errors leave stdout empty')
    t.ok(result.stderr, 'errors are reported on stderr')
  }
  t.end()
})
