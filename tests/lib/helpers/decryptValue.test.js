const t = require('tap')
const { PrivateKey } = require('eciesjs')

const encryptValue = require('../../../src/lib/helpers/encryptValue')
const decryptValue = require('../../../src/lib/helpers/decryptValue')

t.test('#decryptValue', ct => {
  const keyPair = new PrivateKey()
  const publicKey = keyPair.publicKey.toHex()
  const privateKey = keyPair.secret.toString('hex')

  const result = encryptValue('hello', publicKey)
  const decrypted = decryptValue(result, privateKey)
  ct.same(decrypted, 'hello')

  ct.end()
})

t.test('#decryptValue (does not start with encrypted:) returns raw value', ct => {
  const keyPair = new PrivateKey()
  const publicKey = keyPair.publicKey.toHex()
  const privateKey = keyPair.secret.toString('hex')

  const decrypted = decryptValue('world', privateKey)
  ct.same(decrypted, 'world') // return the original raw value

  ct.end()
})

t.test('#decryptValue (fails decryption) returns raw value', ct => {
  const keyPair = new PrivateKey()
  const publicKey = keyPair.publicKey.toHex()
  const privateKey = keyPair.secret.toString('hex')

  const decrypted = decryptValue('encrypted:1234', privateKey)
  ct.same(decrypted, 'encrypted:1234')

  ct.end()
})
