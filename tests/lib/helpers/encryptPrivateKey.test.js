const t = require('tap')

const encryptPrivateKeys = require('../../../src/lib/helpers/encryptPrivateKeys')
const decryptPrivateKeys = require('../../../src/lib/helpers/decryptPrivateKeys')

const privateKey =
  '1fc1cafa954a7a2bf0a6fbff46189c9e03e3a66b4d1133108ab9fcdb9e154b70'
const passPhrase = 'myS3cr3tP@ssPhr@s3'
const salt = 'dotenvx_salt'

t.test('#encryptPrivateKeys', (ct) => {
  const result = encryptPrivateKeys(
    'DOTENV_PRIVATE_KEY_TEST',
    privateKey,
    passPhrase,
    salt
  )
  ct.ok(result.startsWith('encrypted:'))

  const decrypted = decryptPrivateKeys(
    'DOTENV_PRIVATE_KEY_TEST',
    result,
    passPhrase,
    salt
  )
  ct.same(decrypted, privateKey)

  ct.end()
})

t.test('#encryptPrivateKeys missing key', (ct) => {
  try {
    const result = encryptPrivateKeys(
      'DOTENV_PRIVATE_KEY_TEST',
      undefined,
      passPhrase,
      salt
    )
    ct.ok(result.startsWith('encrypted:'))
    ct.debug(`result: ${result}`)
    ct.same(result, privateKey)
  } catch (error) {
    ct.same(error.code, 'MISSING_PRIVATE_KEY_FOR_LOCK')
    ct.same(
      error.message,
      "[MISSING_PRIVATE_KEY_FOR_LOCK] could not find private key 'DOTENV_PRIVATE_KEY_TEST='"
    )
  } finally {
    ct.end()
  }
})

t.test(
  '#encryptPrivateKeys already encrypted returns existing encrypted value',
  (ct) => {
    const result = encryptPrivateKeys(
      'DOTENV_PRIVATE_KEY_TEST',
      'encrypted:WHATEVER',
      passPhrase,
      salt
    )
    ct.debug(`result: ${result}`)
    ct.equal(result, 'encrypted:WHATEVER')
    ct.end()
  }
)
