const t = require('tap')
const proxyquire = require('proxyquire')
const fs = require('fs')
const path = require('path')

function resolver (ct, fail = false) {
  const calls = []
  function response (args, input) {
    if (args.includes('inject')) args = ['inject']
    calls.push(args)
    if (fail) {
      const error = new Error('secret diagnostic')
      error.stderr = '429 quota exceeded'
      throw error
    }
    return args[0] === 'inject'
      ? input.replace(/\{\{ (.*?) \}\}/g, (_, ref) => `resolved-${ref.split('/')[3]}`)
      : `resolved-${args[1].split('/')[3]}`
  }
  const resolve = proxyquire('../../../src/lib/helpers/resolveOnePassword', {
    child_process: {
      execFile: (command, args, options, callback) => {
        if (args[0] === 'read') {
          try { callback(null, response(args)) } catch (error) { callback(error, '', error.stderr) }
          return { stdin: { on: () => {}, end: () => {} } }
        }
        return {
          stdin: {
            on: () => {},
            end: input => {
              try { callback(null, response(args, input)) } catch (error) { callback(error, '', error.stderr) }
            }
          }
        }
      },
      execFileSync: (command, args, options) => response(args, options.input)
    }
  })
  const batch = proxyquire('../../../src/lib/helpers/onePasswordBatch', { './resolveOnePassword': resolve })
  const envs = proxyquire('../../../src/lib/resolvers/envs', { './../helpers/onePasswordBatch': batch })
  return { envs, calls }
}

const reference = (name, item = name) => ({ type: 'env', value: `${name}=op://vault/${item}/password` })
const options = { noArmor: true, noNative: true, noBitwarden: true }

for (const sync of [false, true]) {
  t.test(`five separate arguments use one batch, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const processEnv = {}
    const config = { ...options, processEnv, envs: ['A', 'B', 'C', 'D', 'E'].map(name => reference(name)) }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.same(calls, [['inject']])
    ct.equal(processEnv.A, 'resolved-A')
    ct.equal(processEnv.E, 'resolved-E')
    ct.equal(result.processedEnvs[0].injected.A, 'resolved-A')
    ct.equal(result.processedEnvs[4].parsed.E, 'resolved-E')
  })

  t.test(`expansion and duplicate-key precedence stay source ordered, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const processEnv = {}
    const config = {
      ...options,
      processEnv,
      overload: true,
      // eslint-disable-next-line no-template-curly-in-string
      envs: [reference('A'), reference('B'), { type: 'env', value: 'URL="prefix-${A}"' }, reference('A', 'replacement')]
    }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.equal(processEnv.URL, 'prefix-resolved-A')
    ct.equal(processEnv.A, 'resolved-replacement')
    ct.equal(result.processedEnvs[0].injected.A, 'resolved-A')
    ct.same(calls.map(args => args[0]), ['inject', 'read'])
  })

  t.test(`existing environment wins unless overloaded, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const processEnv = { A: 'machine' }
    const config = { ...options, processEnv, envs: [reference('A'), reference('B'), reference('C')] }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.equal(processEnv.A, 'machine')
    ct.equal(result.processedEnvs[0].existed.A, 'machine')
    ct.same(calls, [['inject']])
  })

  t.test(`inherited references are not resolved just because an injected key has the same value, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const inherited = 'op://vault/B/password'
    const processEnv = { A: inherited }
    const config = { ...options, processEnv, envs: [reference('A'), reference('B'), reference('C')] }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.equal(processEnv.A, inherited)
    ct.equal(result.processedEnvs[0].existed.A, inherited)
    ct.equal(processEnv.B, 'resolved-B')
    ct.same(calls, [['inject']])
  })

  t.test(`disable flag makes zero calls, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const processEnv = {}
    const config = { ...options, no1Password: true, processEnv, envs: [reference('A'), reference('B')] }
    if (sync) envs.sync(config)
    else await envs(config)
    ct.same(calls, [])
    ct.equal(processEnv.A, 'op://vault/A/password')
  })

  t.test(`environment disable flag makes zero calls, sync=${sync}`, async ct => {
    const original = process.env.DOTENVX_NO_1PASSWORD
    process.env.DOTENVX_NO_1PASSWORD = 'true'
    try {
      const { envs, calls } = resolver(ct)
      const processEnv = {}
      const config = { ...options, processEnv, envs: [reference('A'), reference('B')] }
      if (sync) envs.sync(config)
      else await envs(config)
      ct.same(calls, [])
      ct.equal(processEnv.B, 'op://vault/B/password')
    } finally {
      if (original === undefined) delete process.env.DOTENVX_NO_1PASSWORD
      else process.env.DOTENVX_NO_1PASSWORD = original
    }
  })

  t.test(`batch failure is attached to every affected row without retries, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct, true)
    const processEnv = {}
    const config = { ...options, processEnv, envs: [reference('A'), reference('B'), { type: 'env', value: 'PLAIN=ok' }] }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.same(calls, [['inject']])
    ct.equal(result.processedEnvs[0].errors[0].code, '1PASSWORD_FAILED')
    ct.equal(result.processedEnvs[1].errors[0].code, '1PASSWORD_FAILED')
    ct.equal(result.processedEnvs[2].errors.length, 0)
    ct.equal(processEnv.PLAIN, 'ok')
  })

  t.test(`separate files batch without losing parsed metadata, sync=${sync}`, async ct => {
    const dir = ct.testdir({ first: 'A=op://vault/A/password\n', second: 'B=op://vault/B/password\n' })
    const { envs, calls } = resolver(ct)
    const processEnv = {}
    const config = { ...options, processEnv, envs: ['first', 'second'].map(name => ({ type: 'envFile', value: path.join(dir, name) })) }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.same(calls, [['inject']])
    ct.equal(result.processedEnvs[1].injected.B, 'resolved-B')
    ct.equal(result.readableFilepaths.length, 2)
    ct.ok(fs.existsSync(dir))
  })

  t.test(`mixed-provider row resolves OP immediately, sync=${sync}`, async ct => {
    const { envs, calls } = resolver(ct)
    const processEnv = {}
    const config = {
      ...options,
      processEnv,
      envs: [reference('A'), reference('B'), { type: 'env', value: 'C=op://vault/C/password\nD=bw://item/password' }]
    }
    const result = sync ? envs.sync(config) : await envs(config)
    ct.same(calls.map(args => args[0]), ['inject', 'read'])
    ct.equal(result.processedEnvs[2].injected.C, 'resolved-C')
  })
}
