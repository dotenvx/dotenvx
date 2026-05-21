const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const proxyquire = require('proxyquire').noCallThru()

const Run = require('../../../src/lib/services/run')

t.beforeEach(() => {
  process.env = {}
})

t.test('#runSync processes inline env strings', ct => {
  const cwd = process.cwd()
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-runsync-'))
  process.chdir(tmpdir)

  const result = new Run([{ type: 'env', value: 'HELLO=sync' }]).runSync()
  const envRow = result.processedEnvs.find((row) => row.type === 'env')

  t.same(envRow, {
    type: 'env',
    string: 'HELLO=sync',
    privateKeyName: null,
    privateKey: null,
    parsed: { HELLO: 'sync' },
    errors: [],
    injected: { HELLO: 'sync' },
    preExisted: {}
  })
  t.same(result.uniqueInjectedKeys, ['HELLO'])

  process.chdir(cwd)
  ct.end()
})

t.test('#runSync records non-ENOENT env file read errors', ct => {
  const RunWithSyncError = proxyquire('../../../src/lib/services/run', {
    './../helpers/detectEncodingSync': () => {
      throw new Error('Mock Sync Error')
    }
  })

  const result = new RunWithSyncError([{ type: 'envFile', value: '.env' }]).runSync()

  t.equal(result.processedEnvs.length, 1)
  t.equal(result.processedEnvs[0].type, 'envFile')
  t.equal(result.processedEnvs[0].filepath, '.env')
  t.equal(result.processedEnvs[0].errors[0].message, 'Mock Sync Error')
  ct.end()
})

t.test('#runSync runs exact env list', ct => {
  const result = new Run([{ type: 'env', value: 'HELLO=sync' }]).runSync()

  t.same(result.processedEnvs, [{
    type: 'env',
    string: 'HELLO=sync',
    privateKeyName: null,
    privateKey: null,
    parsed: { HELLO: 'sync' },
    errors: [],
    injected: { HELLO: 'sync' },
    preExisted: {}
  }])

  ct.end()
})
