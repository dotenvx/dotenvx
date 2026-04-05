const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const fsx = require('../../../src/lib/helpers/fsx')

let writeFileSyncStub
let readFileStub
let writeFileStub
let accessStub

t.beforeEach((ct) => {
  sinon.restore()
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  readFileStub = sinon.stub(fs.promises, 'readFile')
  writeFileStub = sinon.stub(fs.promises, 'writeFile')
  accessStub = sinon.stub(fs.promises, 'access')
})

t.afterEach((ct) => {
  sinon.restore()
})

t.test('#readFileX (default utf8)', async ct => {
  readFileStub.resolves('hello')

  const out = await fsx.readFileX('tests/somefile.txt')

  t.equal(out, 'hello')
  t.ok(readFileStub.calledWith('tests/somefile.txt', 'utf8'), 'fs.promises.readFile() called with utf8')

  ct.end()
})

t.test('#readFileX (explicit encoding options)', async ct => {
  readFileStub.resolves('hello')

  const out = await fsx.readFileX('tests/somefile.txt', { encoding: 'latin1' })

  t.equal(out, 'hello')
  t.ok(readFileStub.calledWith('tests/somefile.txt', { encoding: 'latin1' }), 'fs.promises.readFile() called with explicit encoding')

  ct.end()
})

t.test('#writeFileXSync', ct => {
  fsx.writeFileXSync('tests/somefile.txt')

  t.ok(writeFileSyncStub.called, 'fs.writeFileSync() called')

  ct.end()
})

t.test('#writeFileX', async ct => {
  await fsx.writeFileX('tests/somefile.txt', 'hello')

  t.ok(writeFileStub.calledWith('tests/somefile.txt', 'hello', 'utf8'), 'fs.promises.writeFile() called with utf8')

  ct.end()
})

t.test('#exists', async ct => {
  accessStub.resolves()
  ct.equal(await fsx.exists('tests/somefile.txt'), true, 'returns true when access succeeds')

  accessStub.rejects(new Error('ENOENT'))
  ct.equal(await fsx.exists('tests/missing.txt'), false, 'returns false when access fails')

  ct.end()
})
