const t = require('tap')

const localKeypair = require('../../../src/lib/helpers/cryptography/localKeypair')
const encryptDeviceValue = require('../../../src/lib/helpers/encryptDeviceValue')
const decryptDeviceValue = require('../../../src/lib/helpers/decryptDeviceValue')

t.test('device value encryption stores prefixless ciphertext', ct => {
  const { publicKey, privateKey } = localKeypair()
  const encrypted = encryptDeviceValue('hello', publicKey)

  ct.notMatch(encrypted, /^encrypted:/)
  ct.equal(decryptDeviceValue(encrypted, privateKey), 'hello')
  ct.end()
})

t.test('device value encryption round trips multiline values', ct => {
  const { publicKey, privateKey } = localKeypair()
  const value = 'line 1\nline 2\nline 3'
  const encrypted = encryptDeviceValue(value, publicKey)

  ct.equal(decryptDeviceValue(encrypted, privateKey), value)
  ct.end()
})
