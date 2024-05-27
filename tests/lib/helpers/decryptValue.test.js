const t = require('tap')

const encryptValue = require('../../../src/lib/helpers/encryptValue')
const decryptValue = require('../../../src/lib/helpers/decryptValue')

const publicKey = '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
const privateKey = '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'

t.test('#decryptValue', ct => {
  const result = encryptValue('hello', publicKey)
  const decrypted = decryptValue(result, privateKey)
  ct.same(decrypted, 'hello')

  ct.end()
})

t.test('#decryptValue (does not start with encrypted:) returns raw value', ct => {
  const decrypted = decryptValue('world', privateKey)
  ct.same(decrypted, 'world') // return the original raw value

  ct.end()
})

t.test('#decryptValue (fails decryption) returns raw value', ct => {
  const decrypted = decryptValue('encrypted:1234', privateKey)
  ct.same(decrypted, 'encrypted:1234')

  ct.end()
})

t.test('#decryptValue when empty string', ct => {
  const result = encryptValue('', publicKey)
  const decrypted = decryptValue(result, privateKey)
  ct.same(decrypted, '')

  ct.end()
})
