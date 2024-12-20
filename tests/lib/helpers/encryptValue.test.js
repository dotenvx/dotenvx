const t = require('tap')

const publicKey = '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
const privateKey = '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'

const encryptValue = require('../../../src/lib/helpers/encryptValue')
const decryptKeyValue = require('../../../src/lib/helpers/decryptKeyValue')

t.test('#encryptValue', ct => {
  const result = encryptValue('hello', publicKey)
  ct.ok(result.startsWith('encrypted:'))

  const decrypted = decryptKeyValue('KEY', result, 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, 'hello')

  ct.end()
})

t.test('#encryptValue - implicit newlines', ct => {
  const value = `line 1
line 2
line 3`

  const result = encryptValue(value, publicKey)
  ct.ok(result.startsWith('encrypted:'))

  const decrypted = decryptKeyValue('KEY', result, 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, value)

  ct.end()
})

t.test('#encryptValue - explicit newlines', ct => {
  const value = 'line 1\nline 2\nline 3'

  const result = encryptValue(value, publicKey)
  ct.ok(result.startsWith('encrypted:'))

  const decrypted = decryptKeyValue('KEY', result, 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, value)

  ct.end()
})
