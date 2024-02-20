const t = require('tap')
const sinon = require('sinon')
const dotenv = require('dotenv')

const DotenvVault = require('../../../src/lib/helpers/dotenvVault')

t.test('#run', ct => {
  const dotenvFiles = {
    '.env': 'HELLO=World'
  }
  const dotenvKeys = {
    DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  }
  const dotenvVaults = {}

  const dotenvVault = new DotenvVault(dotenvFiles, dotenvKeys, dotenvVaults)
  const encryptStub = sinon.stub(dotenvVault, '_encrypt')
  encryptStub.returns('ORIXlJHy1ECtFSWskFcdz15YGnYD5dHLxBpoIGHzqAzukLO7zLUo')

  const {
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = dotenvVault.run()

  const expectedDotenvVaultFile = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/

# development
DOTENV_VAULT_DEVELOPMENT="ORIXlJHy1ECtFSWskFcdz15YGnYD5dHLxBpoIGHzqAzukLO7zLUo"

`

  ct.same(dotenvVaultFile, expectedDotenvVaultFile)
  ct.same(addedVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(existingVaults, [])
  ct.same(addedDotenvFilenames, ['.env'])

  encryptStub.restore()

  ct.end()
})

t.test('#run (vault already exists with same value)', ct => {
  const dotenvFiles = {
    '.env': 'HELLO=World'
  }
  const dotenvKeys = {
    DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  }
  const dotenvVaults = {
    DOTENV_VAULT_DEVELOPMENT: 'ORIXlJHy1ECtFSWskFcdz15YGnYD5dHLxBpoIGHzqAzukLO7zLUo'
  }

  const dotenvVault = new DotenvVault(dotenvFiles, dotenvKeys, dotenvVaults)

  const {
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = dotenvVault.run()

  const expectedDotenvVaultFile = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/

# development
DOTENV_VAULT_DEVELOPMENT="ORIXlJHy1ECtFSWskFcdz15YGnYD5dHLxBpoIGHzqAzukLO7zLUo"

`

  ct.same(dotenvVaultFile, expectedDotenvVaultFile)
  ct.same(addedVaults, [])
  ct.same(existingVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(addedDotenvFilenames, [])

  ct.end()
})

t.test('#_guessEnvironment (.env)', ct => {
  const dotenvVault = new DotenvVault()
  const filepath = '.env'
  const environment = dotenvVault._guessEnvironment(filepath)

  ct.same(environment, 'development')

  ct.end()
})

t.test('#_guessEnvironment (.env.production)', ct => {
  const dotenvVault = new DotenvVault()
  const filepath = '.env.production'
  const environment = dotenvVault._guessEnvironment(filepath)

  ct.same(environment, 'production')

  ct.end()
})

t.test('#_changed (no changed)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const raw = 'HELLO=World'
  const ciphertext = dotenvVault._encrypt(dotenvKey, raw)
  const result = dotenvVault._changed(dotenvKey, ciphertext, raw)

  ct.same(result, false)

  ct.end()
})

t.test('#_changed (yes changed)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const raw = 'HELLO=World'
  const ciphertext = dotenvVault._encrypt(dotenvKey, raw)
  const result = dotenvVault._changed(dotenvKey, ciphertext, 'HELLO=Universe')

  ct.same(result, true)

  ct.end()
})

t.test('#_encrypt', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = dotenvVault._encrypt(dotenvKey, 'HELLO=World')

  const decrypted = dotenvVault._decrypt(dotenvKey, ciphertext)

  ct.same(decrypted, 'HELLO=World')

  ct.end()
})

t.test('#_decrypt', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = dotenvVault._encrypt(dotenvKey, 'HELLO=World')

  const decrypted = dotenvVault._decrypt(dotenvKey, ciphertext)

  ct.same(decrypted, 'HELLO=World')

  ct.end()
})

t.test('#_decrypt (DECRYPTION_FAILED)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = dotenvVault._encrypt(dotenvKey, 'HELLO=World')

  const badDotenvKey = 'dotenv://:key_bc300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  try {
    dotenvVault._decrypt(badDotenvKey, ciphertext)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DECRYPTION_FAILED')
    ct.same(error.message, '[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
    ct.same(error.help, '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.')
    ct.same(error.debug, '[DECRYPTION_FAILED] DOTENV_KEY is dotenv://:key_bc300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development')
  }

  ct.end()
})

t.test('#_decrypt (other error)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'

  const ciphertext = dotenvVault._encrypt(dotenvKey, 'HELLO=World')

  const decryptStub = sinon.stub(dotenv, 'decrypt').throws(new Error('other error'))

  try {
    dotenvVault._decrypt(dotenvKey, ciphertext)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'other error')
  }

  decryptStub.restore()

  ct.end()
})

t.test('#_parseEncryptionKeyFromDotenvKey', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  const key = dotenvVault._parseEncryptionKeyFromDotenvKey(dotenvKey)

  ct.same(key, Buffer.from('ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20', 'hex'))

  ct.end()
})

t.test('#_parseEncryptionKeyFromDotenvKey (INVALID_DOTENV_KEY)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20'

  try {
    dotenvVault._parseEncryptionKeyFromDotenvKey(dotenvKey)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'INVALID_DOTENV_KEY')
    ct.same(error.message, 'INVALID_DOTENV_KEY: Invalid URL')
  }

  ct.end()
})

t.test('#_parseEncryptionKeyFromDotenvKey (INVALID_DOTENV_KEY missing key part)', ct => {
  const dotenvVault = new DotenvVault()
  const dotenvKey = 'dotenv://:@dotenvx.com/vault/.env.vault?environment=development'

  try {
    dotenvVault._parseEncryptionKeyFromDotenvKey(dotenvKey)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'INVALID_DOTENV_KEY')
    ct.same(error.message, 'INVALID_DOTENV_KEY: Missing key part')
  }

  ct.end()
})

t.test('#_hash', ct => {
  const dotenvVault = new DotenvVault()
  const hashed = dotenvVault._hash('hash this')

  ct.same(hashed, '48bd3ddc')

  ct.end()
})
