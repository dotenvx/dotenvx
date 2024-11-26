const t = require('tap')

const encryptValue = require('../../../src/lib/helpers/encryptValue')
const decryptKeyValue = require('../../../src/lib/helpers/decryptKeyValue')

const publicKey = '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
const privateKey = '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'

t.test('#decryptKeyValue', ct => {
  const encryptedString = encryptValue('hello', publicKey)
  const decrypted = decryptKeyValue('KEY', encryptedString, 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, 'hello')

  ct.end()
})

t.test('#decryptKeyValue - privateKey null', ct => {
  const encryptedString = encryptValue('hello', publicKey)

  try {
    decryptKeyValue('KEY', encryptedString, null)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'private key missing or blank')
  }

  ct.end()
})

t.test('#decryptKeyValue (does not start with encrypted:) returns raw value', ct => {
  const decrypted = decryptKeyValue('KEY', 'world', 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, 'world') // return the original raw value

  ct.end()
})

t.test('#decryptKeyValue invalid short encrypted value raises error', ct => {
  try {
    decryptKeyValue('KEY', 'encrypted:1234', 'DOTENV_PRIVATE_KEY', privateKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'second arg must be public key')
  }

  ct.end()
})

t.test('#decryptKeyValue invalid encrypted value raises error', ct => {
  try {
    decryptKeyValue('KEY', 'encrypted:ADJIvD6DxJdTcFdg1tcasYa9G1O5YVtFJs0yJgem+aGIlRJl9N1Fbq6kdPtIwfS0c6VJF4EN6H+D0JUwJ4FmoerQi0XQ4mv4AyA73KjrxVEqmSypg2InsV0e4WxdP5Qx/jVVSgxD', 'DOTENV_PRIVATE_KEY', privateKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'encrypted data looks malformed')
  }

  ct.end()
})

t.test('#decryptKeyValue invalid empty encrypted value raises error', ct => {
  try {
    decryptKeyValue('KEY', 'encrypted:', 'DOTENV_PRIVATE_KEY', privateKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'second arg must be public key')
  }

  ct.end()
})

t.test('#decryptKeyValue invalid privateKey', ct => {
  const encryptedString = encryptValue('hello', publicKey)

  try {
    decryptKeyValue('KEY', encryptedString, 'DOTENV_PRIVATE_KEY', 'invalid-private-key')
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'private key [invalid…] looks invalid')
  }

  ct.end()
})

t.test('#decryptKeyValue empty privateKey', ct => {
  const encryptedString = encryptValue('hello', publicKey)

  try {
    decryptKeyValue('KEY', encryptedString, 'DOTENV_PRIVATE_KEY', '')
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'private key missing or blank')
  }

  ct.end()
})

t.test('#decryptKeyValue wrong privateKey', ct => {
  const encryptedString = encryptValue('hello', publicKey)

  try {
    decryptKeyValue('KEY', encryptedString, 'DOTENV_PRIVATE_KEY', '9c1ab41477004e68066129a8866887d316ba5d7177593dbc5e3026d6f64d32f8')
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, 'private key [9c1ab41…] looks wrong')
  }

  ct.end()
})

t.test('#decryptKeyValue when empty string', ct => {
  const encryptedString = encryptValue('', publicKey)
  const decrypted = decryptKeyValue('KEY', encryptedString, 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, '')

  ct.end()
})

t.test('#decryptKeyValue - hardcoded scenario', ct => {
  const decrypted = decryptKeyValue('KEY', 'encrypted:BMVCQpz/+NYDcGZhbXyqbwP8IDJSTXl4xDQsgusQHEVFAWOXQnKRBTOzRiwuYIJzjuWnKkrQJEDEi8Av9xnfx61jVTJymVWLjVmFK7CM+6lmKOnIhPMzu0Mi0dH82P81bOXjkZTHIIcA', 'DOTENV_PRIVATE_KEY', privateKey)
  ct.same(decrypted, 'expanded')

  ct.end()
})
