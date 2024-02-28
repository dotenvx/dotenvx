const t = require('tap')
const dotenv = require('dotenv')

const decrypt = require('../../../src/lib/helpers/decrypt')

const DotenvVault = require('../../../src/lib/helpers/dotenvVault')

t.test('#run', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  const dotenvFiles = {
    '.env': 'HELLO=World'
  }
  const dotenvKeys = {
    DOTENV_KEY_DEVELOPMENT: dotenvKey
  }
  const dotenvVaults = {}

  const dotenvVault = new DotenvVault(dotenvFiles, dotenvKeys, dotenvVaults)

  const {
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = dotenvVault.run()

  const parsed = dotenv.parse(dotenvVaultFile)
  const decryptedContent = decrypt(parsed.DOTENV_VAULT_DEVELOPMENT, dotenvKey)

  ct.same(decryptedContent, 'HELLO=World')
  ct.same(addedVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(existingVaults, [])
  ct.same(addedDotenvFilenames, ['.env'])

  ct.end()
})

t.test('#run (personal environment variable)', ct => {
  const dotenvKey = 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development'
  const dotenvFiles = {
    '.env': 'HELLO=World\n# personal.dotenvx.com\nHELLO=personal'
  }
  const dotenvKeys = {
    DOTENV_KEY_DEVELOPMENT: dotenvKey
  }
  const dotenvVaults = {}

  const dotenvVault = new DotenvVault(dotenvFiles, dotenvKeys, dotenvVaults)

  const {
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = dotenvVault.run()

  const parsed = dotenv.parse(dotenvVaultFile)
  const decryptedContent = decrypt(parsed.DOTENV_VAULT_DEVELOPMENT, dotenvKey)

  ct.same(decryptedContent, 'HELLO=World\n')
  ct.same(addedVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(existingVaults, [])
  ct.same(addedDotenvFilenames, ['.env'])

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

t.test('#run (no arguments)', ct => {
  const dotenvVault = new DotenvVault()

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

`

  ct.same(dotenvVaultFile, expectedDotenvVaultFile)
  ct.same(addedVaults, [])
  ct.same(existingVaults, [])
  ct.same(addedDotenvFilenames, [])

  ct.end()
})
