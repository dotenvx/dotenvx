const { WriteStream } = require('tty')
const t = require('tap')
const sinon = require('sinon')

const depth = require('../../../src/lib/helpers/colorDepth')

t.test('returns WriteStream.prototype.getColorDepth() if present', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').returns(256)
  ct.equal(depth.getColorDepth(), 256)

  stub.restore()
  ct.end()
})

t.test('defaults to 2', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').returns(null)

  ct.equal(depth.getColorDepth(), 2)

  stub.restore()
  ct.end()
})
