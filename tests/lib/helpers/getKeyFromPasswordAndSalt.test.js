const t = require('tap')
const {
  getKeyFromPasswordAndSalt
} = require('../../../src/lib/helpers/getKeyFromPasswordAndSalt')

const passPhrase = 'myS3cr3tP@ssPhr@s3'
const salt = 'dotenvx_salt'
const uint8arrayWithSalt = new Uint8Array([
  108, 116, 61, 139, 136, 219, 29, 192, 53, 38, 46, 69, 46, 22, 32, 56, 20, 184,
  12, 33, 93, 82, 121, 82, 227, 244, 23, 204, 67, 2, 32, 229
])

const uint8arrayDefaultSalt = new Uint8Array([
  189, 148, 226, 78, 71, 102, 183, 179, 101, 199, 154, 90, 234, 119, 45, 49,
  160, 83, 246, 143, 13, 158, 217, 38, 27, 92, 79, 104, 44, 8, 35, 1
])

t.test('#getKeyFromPasswordAndSalt', (ct) => {
  const key = getKeyFromPasswordAndSalt(passPhrase, salt)

  t.same(key, uint8arrayWithSalt)

  ct.end()
})

t.test('#getKeyFromPasswordAndSalt NO salt provided', (ct) => {
  const key = getKeyFromPasswordAndSalt(passPhrase)

  t.same(key, uint8arrayDefaultSalt)

  ct.end()
})
