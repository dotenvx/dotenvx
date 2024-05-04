const t = require('tap')
const { PrivateKey } = require('eciesjs')

const encryptValue = require('../../../src/lib/helpers/encryptValue')
const decryptValue = require('../../../src/lib/helpers/decryptValue')

t.test('#encryptValue', ct => {
  const keyPair = new PrivateKey()
  const publicKey = keyPair.publicKey.toHex()
  const privateKey = keyPair.secret.toString('hex')

  const result = encryptValue('hello', publicKey)
  ct.ok(result.startsWith('encrypted:'))

  const decrypted = decryptValue(result, privateKey)
  ct.same(decrypted, 'hello')

  ct.end()
})
