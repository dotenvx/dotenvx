const t = require('tap')
const proxyquire = require('proxyquire')

t.test('resolves op:// values asynchronously', async ct => {
  const calls = []
  const statuses = []
  const resolveOnePassword = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFile: (command, args, options, callback) => {
        calls.push([command, args, options])
        return { stdin: { on: () => {}, end: input => callback(null, input.replace(/\{\{ .*? \}\}/g, 'super-secret'), '') } }
      },
      execFileSync: () => ct.fail('should not call execFileSync')
    }
  })
  const parsed = {
    SECRET: 'op://vault/item/password',
    SECOND_SECRET: 'op://vault/second/password',
    PLAIN: 'value'
  }

  const result = await resolveOnePassword(parsed, { onStatus: status => statuses.push(status) })

  ct.equal(parsed.SECRET, 'super-secret')
  ct.equal(parsed.SECOND_SECRET, 'super-secret')
  ct.equal(parsed.PLAIN, 'value')
  ct.same(calls[0][0], process.platform === 'win32' ? 'op' : '/bin/sh')
  ct.same(calls[0][1], process.platform === 'win32' ? ['inject'] : ['-c', 'cat | op "$@"', 'dotenvx-op', 'inject'])
  ct.equal(calls.length, 1)
  ct.same(statuses, ['awaiting 1password', 'injecting'])
  ct.same(result, { errors: [], unresolved: [] })
})

t.test('resolves op:// values synchronously without a shell', ct => {
  const calls = []
  const resolveOnePassword = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFile: () => ct.fail('should not call execFile'),
      execFileSync: (command, args, options) => {
        calls.push([command, args, options])
        return 'super-secret'
      }
    }
  })
  const parsed = { SECRET: 'op://vault/item/password; echo unsafe', PLAIN: 'value' }

  const result = resolveOnePassword.sync(parsed)

  ct.equal(parsed.SECRET, 'super-secret')
  ct.equal(parsed.PLAIN, 'value')
  ct.same(calls[0][0], 'op')
  ct.same(calls[0][1], ['read', 'op://vault/item/password; echo unsafe', '--no-newline'])
  ct.same(result, { errors: [], unresolved: [] })
  ct.end()
})

t.test('batch preserves multiline, empty and special-character values synchronously', ct => {
  const expected = ['line1\nline2\n', '', '"$\\{{ literal }}']
  let calls = 0
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFileSync: (command, args, options) => {
        calls++
        ct.equal(command, process.platform === 'win32' ? 'op' : '/bin/sh')
        ct.same(args, process.platform === 'win32' ? ['inject'] : ['-c', 'cat | op "$@"', 'dotenvx-op', 'inject'])
        ct.notOk(options.shell)
        let index = 0
        return options.input.replace(/\{\{ .*? \}\}/g, () => expected[index++])
      }
    }
  })
  const parsed = { A: 'op://vault/one/password', B: 'op://vault/two/password', C: 'op://vault/three/password' }
  ct.same(resolve.sync(parsed), { errors: [], unresolved: [] })
  ct.same(Object.values(parsed), expected)
  ct.equal(calls, 1)
  ct.end()
})

t.test('batch failures do not expose subprocess output or retry quota failures', async ct => {
  let calls = 0
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFile: (command, args, options, callback) => {
        calls++
        const error = new Error('SECRET in subprocess diagnostics')
        error.stderr = '429 Too Many Requests; item not found SECRET'
        callback(error, '', error.stderr)
        return { stdin: { on: () => {}, end: () => {} } }
      }
    }
  })
  const parsed = { A: 'op://vault/one/password', B: 'op://vault/two/password' }
  const result = await resolve(parsed)
  ct.equal(calls, 1)
  ct.same(result.unresolved, ['A', 'B'])
  ct.notMatch(JSON.stringify(result), 'SECRET')
  ct.equal(parsed.A, 'op://vault/one/password')
})

t.test('ordinary item lookup failure recovers valid fields individually', ct => {
  const calls = []
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFileSync: (command, args) => {
        calls.push(args)
        if (args.includes('inject') || args[1].includes('/missing/')) {
          const error = new Error('private diagnostics')
          error.stderr = 'item not found'
          throw error
        }
        return 'resolved'
      }
    }
  })
  const parsed = { A: 'op://vault/one/password', B: 'op://vault/missing/password' }
  const result = resolve.sync(parsed)
  ct.equal(calls.length, 3)
  ct.equal(parsed.A, 'resolved')
  ct.equal(parsed.B, 'op://vault/missing/password')
  ct.same(result.unresolved, ['B'])
  ct.end()
})

t.test('batch response mismatch preserves every reference without retrying', ct => {
  let calls = 0
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: { execFileSync: () => { calls++; return 'unexpected' } }
  })
  const parsed = { A: 'op://vault/one/password', B: 'op://vault/two/password' }
  const original = { ...parsed }
  const result = resolve.sync(parsed)
  ct.same(parsed, original)
  ct.same(result.unresolved, ['A', 'B'])
  ct.equal(calls, 1)
  ct.end()
})

t.test('no secret references means no subprocess', async ct => {
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: { execFile: () => ct.fail('no subprocess expected'), execFileSync: () => ct.fail('no subprocess expected') }
  })
  ct.same(await resolve({ PLAIN: 'value' }), { errors: [], unresolved: [] })
  ct.same(resolve.sync({ PLAIN: 'value' }), { errors: [], unresolved: [] })
})

t.test('missing CLI reports every batched key without attempting individual reads', ct => {
  let calls = 0
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFileSync: () => {
        calls++
        const error = new Error('private diagnostics')
        error.code = 'ENOENT'
        throw error
      }
    }
  })
  const result = resolve.sync({ A: 'op://vault/one/password', B: 'op://vault/two/password' })
  ct.equal(calls, 1)
  ct.same(result.unresolved, ['A', 'B'])
  ct.match(result.errors[1].message, 'CLI is not installed')
  ct.end()
})

t.test('missing op behind the POSIX pipe still reports a missing CLI', ct => {
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFileSync: () => {
        const error = new Error('private diagnostics')
        error.status = 127
        error.stderr = '/bin/sh: 1: op: not found'
        throw error
      }
    }
  })
  const result = resolve.sync({ A: 'op://vault/one/password', B: 'op://vault/two/password' })
  ct.same(result.unresolved, ['A', 'B'])
  ct.match(result.errors[0].message, 'CLI is not installed')
  ct.end()
})

t.test('reports a missing op CLI and preserves the unresolved reference', ct => {
  const resolveOnePassword = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFile: () => ct.fail('should not call execFile'),
      execFileSync: () => {
        const error = new Error('spawn op ENOENT op://private/reference')
        error.code = 'ENOENT'
        throw error
      }
    }
  })

  const parsed = { DATABASE_PASSWORD: 'op://private/reference', PLAIN: 'value' }
  const result = resolveOnePassword.sync(parsed)

  ct.same(parsed, { DATABASE_PASSWORD: 'op://private/reference', PLAIN: 'value' })
  ct.same(result.unresolved, ['DATABASE_PASSWORD'])
  ct.match(result.errors[0], {
    code: '1PASSWORD_FAILED',
    message: '[1PASSWORD_FAILED] 1Password CLI is not installed and could not resolve DATABASE_PASSWORD',
    help: 'fix: [https://www.1password.dev/cli/get-started]'
  })
  ct.end()
})
