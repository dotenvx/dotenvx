const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
const fsx = path.resolve(__dirname, '../../src/lib/helpers/fsx.js')

function fixture (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-concurrent-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const env = {
    CI: 'true',
    DOTENVX_NO_ARMOR: 'true',
    DOTENVX_NO_NATIVE: 'true',
    DOTENVX_NO_1PASSWORD: 'true',
    DOTENVX_NO_BITWARDEN: 'true',
    HOME: dir,
    USERPROFILE: dir,
    APPDATA: dir,
    LOCALAPPDATA: dir,
    XDG_CONFIG_HOME: dir,
    TMPDIR: dir,
    TMP: dir,
    TEMP: dir
  }
  for (const key of ['SystemRoot', 'WINDIR', 'PATH']) {
    if (process.env[key]) env[key] = process.env[key]
  }
  fs.mkdirSync(path.join(dir, 'a'))
  fs.mkdirSync(path.join(dir, 'b'))
  // Pause a real CLI only after it has read the shared key snapshot. No
  // cryptography, key storage or CLI exit status is replaced by the hook.
  const hook = path.join(dir, 'pause.cjs')
  fs.writeFileSync(hook, `
    const fsx = require(${JSON.stringify(fsx)})
    const path = require('path')
    const fs = require('fs')
    const read = fs.promises.readFile
    const write = fsx.writeKeyFile
    let paused = false
    async function pause (file) {
      if (!paused && typeof file === 'string' && path.basename(file) === '.env.keys') {
        paused = true
        process.send('snapshot')
        await new Promise(resolve => process.once('message', resolve))
        process.disconnect()
      }
    }
    if (process.env.PAUSE_PHASE === 'commit') {
      fsx.writeKeyFile = async function (file, ...args) {
        await pause(file)
        return write(file, ...args)
      }
    } else {
      fs.promises.readFile = async function (file, ...args) {
        let result, error
        try { result = await read(file, ...args) } catch (err) { error = err }
        await pause(file)
        if (error) throw error
        return result
      }
    }
  `)
  return { dir, env, hook }
}

function run (f, args, pause = false, cwd = f.dir) {
  const child = spawn(process.execPath, [...(pause ? ['--require', f.hook] : []), cli, ...args], {
    cwd,
    env: f.env,
    stdio: ['ignore', 'pipe', 'pipe', ...(pause ? ['ipc'] : [])]
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  const ready = pause
    ? new Promise((resolve, reject) => {
      child.once('message', resolve)
      child.once('exit', () => reject(new Error('CLI exited before snapshot: ' + stderr)))
      child.once('error', reject)
    })
    : null
  const result = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill(); reject(new Error('CLI timed out')) }, 20000)
    child.once('error', reject)
    child.once('close', code => {
      clearTimeout(timeout)
      resolve({ code, stdout: stdout.trim(), stderr })
    })
  })
  return { child, ready, result }
}

async function get (t, f, file, expected) {
  const result = await run(f, ['get', 'HELLO', '-f', file, '-fk', '.env.keys']).result
  t.equal(result.code, 0, result.stderr)
  t.equal(result.stdout, expected, `${file} decrypts using the shared key file`)
}

t.test('serial CLI encryption preserves keys for matching basenames', async t => {
  const f = fixture(t)
  for (const [file, value] of [['a/.env', 'alpha'], ['b/.env', 'beta']]) {
    fs.writeFileSync(path.join(f.dir, file), `HELLO=${value}\n`)
    const result = await run(f, ['encrypt', '-f', file, '-fk', '.env.keys']).result
    t.equal(result.code, 0, result.stderr)
  }
  await get(t, f, 'a/.env', 'alpha')
  await get(t, f, 'b/.env', 'beta')
})

for (const sameBasename of [false, true]) {
  t.test(`concurrent CLI encryption retains decryptability (same basename: ${sameBasename})`, async t => {
    const f = fixture(t)
    const first = sameBasename ? 'a/.env' : 'a/.env.alpha'
    const second = sameBasename ? 'b/.env' : 'b/.env.beta'
    fs.writeFileSync(path.join(f.dir, '.env.existing'), 'HELLO=existing\n')
    const seed = await run(f, ['encrypt', '-f', '.env.existing']).result
    t.equal(seed.code, 0, seed.stderr)
    const keysBefore = fs.readFileSync(path.join(f.dir, '.env.keys'), 'utf8')
    fs.writeFileSync(path.join(f.dir, first), 'HELLO=alpha\n')
    fs.writeFileSync(path.join(f.dir, second), 'HELLO=beta\n')
    const a = run(f, ['encrypt', '-f', first, '-fk', '.env.keys'], true)
    try {
      await a.ready
      // Different cwd and a relative alias must address the very same lock.
      const b = await run(f, ['encrypt', '-f', path.basename(second), '-fk', '../.env.keys'], false, path.join(f.dir, 'b')).result
      t.equal(b.code, 0, 'second writer commits while first prepares: ' + b.stderr)
      a.child.send('release')
      const result = await a.result
      t.equal(result.code, 1)
      t.match(result.stderr, /KEY_FILE_CHANGED/)
      t.equal(fs.readFileSync(path.join(f.dir, first), 'utf8'), 'HELLO=alpha\n', 'stale writer does not change plaintext')
      const retry = await run(f, ['encrypt', '-f', first, '-fk', '.env.keys']).result
      t.equal(retry.code, 0, 'next invocation succeeds after conflict: ' + retry.stderr)
      t.ok(fs.readFileSync(path.join(f.dir, '.env.keys'), 'utf8').startsWith(keysBefore), 'existing keys are preserved')
      await get(t, f, first, 'alpha')
      await get(t, f, second, 'beta')
      await get(t, f, '.env.existing', 'existing')
    } finally {
      if (a.child.connected) a.child.send('release')
      await a.result
    }
  })
}

t.test('an interrupted first writer leaves a safe lock until manual recovery', async t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.dir, '.env'), 'HELLO=alpha\n')
  fs.writeFileSync(path.join(f.dir, '.env.beta'), 'HELLO=beta\n')
  const a = run({ ...f, env: { ...f.env, PAUSE_PHASE: 'commit' } }, ['encrypt'], true)
  try {
    await a.ready
    const contender = await run(f, ['encrypt', '-f', '.env.beta']).result
    t.equal(contender.code, 1)
    t.match(contender.stderr, /KEY_FILE_LOCKED/)
    t.equal(fs.readFileSync(path.join(f.dir, '.env.beta'), 'utf8'), 'HELLO=beta\n')
    a.child.kill()
    await a.result
    const retry = await run(f, ['encrypt']).result
    t.equal(retry.code, 1)
    t.match(retry.stderr, /only after confirming no encrypt command is running/)
    t.equal(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), 'HELLO=alpha\n')
    t.notOk(fs.existsSync(path.join(f.dir, '.env.keys')))
    // This test owns the terminated child; no live writer remains.
    fs.rmdirSync(path.join(f.dir, '.env.keys.lock'))
    const recovered = await run(f, ['encrypt']).result
    t.equal(recovered.code, 0, recovered.stderr)
    await get(t, f, '.env', 'alpha')
  } finally {
    if (a.child.connected) a.child.kill()
    await a.result
  }
})

t.test('a failed key write leaves plaintext intact and releases the lock', async t => {
  const f = fixture(t)
  const original = 'HELLO=alpha\n'
  fs.writeFileSync(path.join(f.dir, '.env'), original)
  const fault = path.join(f.dir, 'fault.cjs')
  fs.writeFileSync(fault, `
    require(${JSON.stringify(fsx)}).writeKeyFile = async () => {
      throw new Error('injected key write failure')
    }
  `)
  const failed = await run({ ...f, env: { ...f.env, NODE_OPTIONS: '--require=' + JSON.stringify(fault) } }, ['encrypt']).result
  t.equal(failed.code, 1)
  t.match(failed.stderr, /injected key write failure/)
  t.equal(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), original)
  t.notOk(fs.existsSync(path.join(f.dir, '.env.keys')))
  t.notOk(fs.existsSync(path.join(f.dir, '.env.keys.lock')))
  const retry = await run(f, ['encrypt']).result
  t.equal(retry.code, 0, retry.stderr)
  await get(t, f, '.env', 'alpha')
})

for (const keyPath of ['missing/.env.keys', 'notdir/.env.keys']) {
  t.test(`existing public key encrypts with an unused key path ${keyPath}`, async t => {
    const f = fixture(t)
    const { publicKey } = require('@dotenvx/primitives').keypair()
    fs.writeFileSync(path.join(f.dir, 'notdir'), 'regular file')
    fs.writeFileSync(path.join(f.dir, '.env'), `DOTENV_PUBLIC_KEY=${publicKey}\nHELLO=alpha\n`)
    const result = await run(f, ['encrypt', '--quiet', '-fk', keyPath]).result
    t.equal(result.code, 0, result.stderr)
    t.match(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), /encrypted:/)
    t.notOk(fs.existsSync(path.join(f.dir, 'missing')))
    t.equal(fs.readFileSync(path.join(f.dir, 'notdir'), 'utf8'), 'regular file')
  })
}

t.test('unchanged file keys are neither locked nor rewritten', async t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.dir, '.env'), 'HELLO=alpha\n')
  const seed = await run(f, ['encrypt']).result
  t.equal(seed.code, 0, seed.stderr)
  const keys = fs.readFileSync(path.join(f.dir, '.env.keys'))
  const publicKey = require('@dotenvx/primitives').publickeys(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'))[0]
  fs.writeFileSync(path.join(f.dir, '.env'), `DOTENV_PUBLIC_KEY=${publicKey}\nHELLO=alpha\n`)
  fs.mkdirSync(path.join(f.dir, '.env.keys.lock'))
  const fault = path.join(f.dir, 'no-key-write.cjs')
  fs.writeFileSync(fault, `require(${JSON.stringify(fsx)}).writeKeyFile = async () => { throw new Error('unexpected key write') }`)
  const result = await run({ ...f, env: { ...f.env, NODE_OPTIONS: '--require=' + JSON.stringify(fault) } }, ['encrypt', '--quiet']).result
  t.equal(result.code, 0, result.stderr)
  t.same(fs.readFileSync(path.join(f.dir, '.env.keys')), keys)
  t.ok(fs.existsSync(path.join(f.dir, '.env.keys.lock')))
  await get(t, f, '.env', 'alpha')
})

t.test('an initially missing key file created by another writer rejects every prepared env', async t => {
  const f = fixture(t)
  for (const file of ['.env', '.env.extra', '.env.beta']) fs.writeFileSync(path.join(f.dir, file), 'HELLO=alpha\n')
  const a = run(f, ['encrypt', '-f', '.env', '-f', '.env.extra'], true)
  try {
    await a.ready
    const b = await run(f, ['encrypt', '-f', '.env.beta']).result
    t.equal(b.code, 0, b.stderr)
    const keys = fs.readFileSync(path.join(f.dir, '.env.keys'))
    a.child.send('release')
    const result = await a.result
    t.equal(result.code, 1)
    t.match(result.stderr, /KEY_FILE_CHANGED/)
    t.same(fs.readFileSync(path.join(f.dir, '.env.keys')), keys)
    for (const file of ['.env', '.env.extra']) t.equal(fs.readFileSync(path.join(f.dir, file), 'utf8'), 'HELLO=alpha\n')
    t.notOk(fs.existsSync(path.join(f.dir, '.env.keys.lock')))
    const retry = await run(f, ['encrypt', '-f', '.env', '-f', '.env.extra']).result
    t.equal(retry.code, 0, retry.stderr)
    for (const file of ['.env', '.env.extra', '.env.beta']) await get(t, f, file, 'alpha')
  } finally {
    if (a.child.connected) a.child.send('release')
    await a.result
  }
})

for (const [phase, code] of [
  ['initial', 'EACCES'],
  ['commit', 'EACCES'],
  ['initial', 'ENOTDIR'],
  ['commit', 'ENOTDIR']
]) {
  t.test(`a ${phase} key read ${code} error cannot overwrite keys or any env`, async t => {
    const f = fixture(t)
    const keyfile = path.join(f.dir, '.env.keys')
    const originalKeys = '# existing key file\n'
    fs.writeFileSync(keyfile, originalKeys)
    const { publicKey } = require('@dotenvx/primitives').keypair()
    const publicEnv = `DOTENV_PUBLIC_KEY=${publicKey}\nHELLO=public\n`
    fs.writeFileSync(path.join(f.dir, '.env.public'), publicEnv)
    fs.writeFileSync(path.join(f.dir, '.env'), 'HELLO=alpha\n')
    const fault = path.join(f.dir, 'read-error.cjs')
    fs.writeFileSync(fault, `
      const fs = require('fs')
      const path = require('path')
      const read = fs.promises.readFile
      const fsx = require(${JSON.stringify(fsx)})
      const exists = fsx.exists
      fsx.exists = async file => typeof file === 'string' && path.basename(file) === '.env.keys' ? false : exists(file)
      fs.promises.readFile = async function (file, ...args) {
        if (typeof file === 'string' && path.basename(file) === '.env.keys' && (${JSON.stringify(phase)} === 'initial' || fs.existsSync(file + '.lock'))) {
          throw Object.assign(new Error('injected unreadable key file'), { code: ${JSON.stringify(code)} })
        }
        return read(file, ...args)
      }
    `)
    const failedEnv = { ...f.env, NODE_OPTIONS: '--require=' + JSON.stringify(fault) }
    const result = await run({ ...f, env: failedEnv }, ['encrypt', '-f', '.env.public', '-f', '.env']).result
    t.equal(result.code, 1)
    t.match(result.stderr, /injected unreadable key file/)
    t.equal(fs.readFileSync(keyfile, 'utf8'), originalKeys)
    t.equal(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), 'HELLO=alpha\n')
    t.equal(fs.readFileSync(path.join(f.dir, '.env.public'), 'utf8'), publicEnv)
    t.notOk(fs.existsSync(keyfile + '.lock'))
    if (phase === 'initial') {
      const publicOnly = await run({ ...f, env: failedEnv }, ['encrypt', '--quiet', '-f', '.env.public']).result
      t.equal(publicOnly.code, 0, publicOnly.stderr)
      t.match(fs.readFileSync(path.join(f.dir, '.env.public'), 'utf8'), /encrypted:/)
      t.equal(fs.readFileSync(keyfile, 'utf8'), originalKeys)
    }
    const retry = await run(f, ['encrypt']).result
    t.equal(retry.code, 0, retry.stderr)
    await get(t, f, '.env', 'alpha')
  })
}

for (const encoding of ['empty', 'utf16le']) {
  t.test(`updates ${encoding} key files without losing decryptability`, async t => {
    const f = fixture(t)
    const keyfile = path.join(f.dir, '.env.keys')
    if (encoding === 'utf16le') {
      fs.writeFileSync(path.join(f.dir, '.env.existing'), 'HELLO=existing\n')
      const seed = await run(f, ['encrypt', '-f', '.env.existing']).result
      t.equal(seed.code, 0, seed.stderr)
      fs.writeFileSync(keyfile, '\uFEFF' + fs.readFileSync(keyfile, 'utf8'), 'utf16le')
    } else {
      fs.writeFileSync(keyfile, '')
    }
    fs.writeFileSync(path.join(f.dir, '.env'), 'HELLO=alpha\n')
    const result = await run(f, ['encrypt']).result
    t.equal(result.code, 0, result.stderr)
    await get(t, f, '.env', 'alpha')
    if (encoding === 'utf16le') await get(t, f, '.env.existing', 'existing')
  })
}

t.test('public-key and stdout encryption do not need the key-file lock', async t => {
  const f = fixture(t)
  const { publicKey } = require('@dotenvx/primitives').keypair()
  fs.mkdirSync(path.join(f.dir, '.env.keys.lock'))
  fs.writeFileSync(path.join(f.dir, '.env'), 'HELLO=alpha\n')
  const stdout = await run(f, ['encrypt', '--stdout']).result
  t.equal(stdout.code, 0, stdout.stderr)
  t.match(stdout.stdout, /encrypted:/)
  t.equal(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), 'HELLO=alpha\n')
  const explicit = await run(f, ['encrypt', '--with', publicKey]).result
  t.equal(explicit.code, 0, explicit.stderr)
  t.match(fs.readFileSync(path.join(f.dir, '.env'), 'utf8'), /encrypted:/)
  t.notOk(fs.existsSync(path.join(f.dir, '.env.keys')))
  t.ok(fs.existsSync(path.join(f.dir, '.env.keys.lock')))
})
