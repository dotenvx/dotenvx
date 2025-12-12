const t = require('tap')
const { base64ToBytes } = require('../../../src/lib/helpers/base64ToBytes')
const { bytesToBase64 } = require('../../../src/lib/helpers/bytesToBase64')

const base64String = 'VGhpcyBpcyBhbiBleGFtcGxlIGJhc2U2NCBzdHJpbmc='

const uint8array = new Uint8Array([
  84, 104, 105, 115, 32, 105, 115, 32, 97, 110, 32, 101, 120, 97, 109, 112, 108,
  101, 32, 98, 97, 115, 101, 54, 52, 32, 115, 116, 114, 105, 110, 103
])

t.test('#base64ToBytesToBase64: base64 to bytes back to base64', (ct) => {
  const bytes = base64ToBytes(base64String)

  t.same(bytes, uint8array)
  const base64 = bytesToBase64(bytes)

  t.equal(base64, base64String)

  ct.end()
})

t.test('#base64ToBytesToBase64: bytes to base64 back to bytes', (ct) => {
  const base64 = bytesToBase64(uint8array)

  t.equal(base64, base64String)

  const bytes = base64ToBytes(base64)

  t.same(bytes, uint8array)

  ct.end()
})
