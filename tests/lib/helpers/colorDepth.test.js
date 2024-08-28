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

t.test('returns 4 when getColorDepth throws an error', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').throws(new TypeError('Not a function'))
  ct.equal(depth.getColorDepth(), 4, 'should return 4 when getColorDepth is not a function')

  stub.restore()
  ct.end()
})
