const { WriteStream } = require('tty')
const t = require('tap')
const sinon = require('sinon')

const depth = require('../../../src/lib/helpers/colorDepth')

t.test('returns WriteStream.prototype.getColorDepth()', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').returns(8)
  ct.equal(depth.getColorDepth(), 8)

  stub.restore()
  ct.end()
})
