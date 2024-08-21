const t = require('tap')
const sinon = require('sinon')

const { getColor, bold } = require('../../src/shared/colors')
const depth = require('../../src/lib/helpers/colorDepth')

t.test('getColor with ansi256 color support', (ct) => {
  const stub = sinon.stub(depth, 'getColorDepth').returns(8)

  ct.equal(getColor('orangered')('hello'), '\x1b[38;5;202mhello\x1b[39m')

  stub.restore()
  ct.end()
})

t.test('getColor with ansi16 color support', (ct) => {
  const stub = sinon.stub(depth, 'getColorDepth').returns(4)

  ct.equal(getColor('orangered')('hello'), '\x1b[31mhello\x1b[39m')

  stub.restore()
  ct.end()
})

t.test('getColor without color support', (ct) => {
  const stub = sinon.stub(depth, 'getColorDepth').returns(1)

  ct.equal(getColor('orangered')('hello'), 'hello')

  stub.restore()
  ct.end()
})

t.test('getColor invalid color', (ct) => {
  try {
    getColor('invalid')

    ct.fail('getColor should throw error')
  } catch (error) {
    ct.pass(' threw an error')
    ct.equal(error.message, 'Invalid color invalid')
  }

  ct.end()
})

t.test('bold with ansi16 color support', (ct) => {
  const stub = sinon.stub(depth, 'getColorDepth').returns(4)

  ct.equal(bold('hello'), '\x1b[1mhello\x1b[22m')

  stub.restore()
  ct.end()
})

t.test('bold without color support', (ct) => {
  const stub = sinon.stub(depth, 'getColorDepth').returns(1)

  ct.equal(bold('hello'), 'hello')

  stub.restore()
  ct.end()
})
