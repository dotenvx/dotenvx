const t = require('tap')
const sinon = require('sinon')
const dotenv = require('dotenv')

const decrypt = require('../../../src/lib/helpers/decrypt')
const encrypt = require('../../../src/lib/helpers/encrypt')

t.test('#decrypt', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = encrypt('HELLO=World', dotenvKey)
  const decrypted = decrypt(ciphertext, dotenvKey)

  ct.same(decrypted, 'HELLO=World')

  ct.end()
})

t.test('#decrypt (DECRYPTION_FAILED)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = encrypt('HELLO=World', dotenvKey)

  const badDotenvKey = 'dotenv://:key_bc300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  try {
    decrypt(ciphertext, badDotenvKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, '[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
    ct.same(error.help, '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.')
    ct.same(error.debug, '[DECRYPTION_FAILED] DOTENV_KEY is dotenv://:key_bc300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development')
  }

  ct.end()
})

t.test('#decrypt (INVALID_CIPHERTEXT)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  const ciphertext = 'abc'

  try {
    decrypt(ciphertext, dotenvKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'INVALID_CIPHERTEXT')
    ct.same(error.message, '[INVALID_CIPHERTEXT] Unable to decrypt what appears to be invalid ciphertext.')
    ct.same(error.help, '[INVALID_CIPHERTEXT] Run with debug flag [dotenvx run --debug -- yourcommand] or manually check .env.vault.')
    ct.same(error.debug, '[INVALID_CIPHERTEXT] ciphertext is \'abc\'')
  }

  ct.end()
})

t.test('#decrypt (other error)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = encrypt('HELLO=World', dotenvKey)

  const decryptStub = sinon.stub(dotenv, 'decrypt').throws(new Error('other error'))

  try {
    decrypt(ciphertext, dotenvKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'other error')
  }

  decryptStub.restore()

  ct.end()
})
