const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const fsx = require('../../../src/lib/helpers/fsx')

let writeFileSyncStub

t.beforeEach((ct) => {
  process.env = {}
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#writeFileX', ct => {
  fsx.writeFileX('tests/somefile.txt')

  t.ok(writeFileSyncStub.called, 'fs.writeFileSync() called')

  ct.end()
})
