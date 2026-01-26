const t = require('tap')

const decryptPrivateKeys = require('../../../src/lib/helpers/decryptPrivateKeys')

const privateKey =
  '5bcd0901dd46636a3d402d779c2dcd9b4a8b860d5027e62c48fe27ea874937c0'
const privateKeyEncrypted =
  'encrypted:dinweJRZ68loijq6wwQqttBInzOJ6XpP1Fgl80wO7VgAKB5qEDgdD5lB+DCO3lK4aCOuPWQiO+lp9Eg7Lb7KtQdAByWm+Yv059H0vqfSFT4MmvYx/CLOrVmT1XgiZRP3'
const passPhrase = 'myS3cr3tP@ssPhr@s3'
const salt = 'dotenvx_salt'

t.test('#decryptPrivateKeys', (ct) => {
  const result = decryptPrivateKeys(
    'DOTENV_PRIVATE_KEY_TEST',
    privateKeyEncrypted,
    passPhrase,
    salt
  )
  ct.ok(!result.startsWith('encrypted:'))

  ct.same(result, privateKey)

  ct.end()
})

t.test('#decryptPrivateKeys not encrypted', (ct) => {
  const result = decryptPrivateKeys(
    'DOTENV_PRIVATE_KEY_TEST',
    privateKey,
    passPhrase,
    salt
  )

  ct.equal(result, privateKey)

  ct.end()
})

t.test('#decryptPrivateKeys wrong passphrase', (ct) => {
  try {
    const result = decryptPrivateKeys(
      'DOTENV_PRIVATE_KEY_TEST',
      privateKeyEncrypted,
      'wrongPassPhrase',
      salt
    )

    ct.equal(result, privateKey)
  } catch (error) {
    ct.same(error.code, 'INVALID_PASS_PHRASE')
    ct.same(
      error.message,
      "[INVALID_PASS_PHRASE] could not decrypt private key 'DOTENV_PRIVATE_KEY_TEST=encrypt…' using the provided passphrase and salt"
    )
  } finally {
    ct.end()
  }
})

t.test('#encryptPrivateKeys empty private key', (ct) => {
  try {
    decryptPrivateKeys(
      'DOTENV_PRIVATE_KEY_TEST',
      '',
      passPhrase,
      salt
    )
  } catch (error) {
    ct.equal(error.code, 'MISSING_PRIVATE_KEY_FOR_LOCK')
    ct.equal(
      error.message,
      "[MISSING_PRIVATE_KEY_FOR_LOCK] could not find private key 'DOTENV_PRIVATE_KEY_TEST='"
    )
  } finally {
    ct.end()
  }
})
