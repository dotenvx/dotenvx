const { scan } = require('@dotenvx/primitives')
const canonicalEnvFilename = require('../helpers/canonicalEnvFilename')
const environment = require('./environment')

function keynames (filepath = '.env', src = '') {
  const { parsed } = scan(src)

  // src public key name wins
  for (const publicKeyName in parsed) {
    if (publicKeyName.startsWith('DOTENV_PUBLIC_KEY')) {
      return {
        publicKeyName,
        privateKeyName: publicKeyName.replace('DOTENV_PUBLIC_KEY', 'DOTENV_PRIVATE_KEY'),
        keyCustodyName: publicKeyName.replace('DOTENV_PUBLIC_KEY', 'DOTENV_KEY_CUSTODY')
      }
    }
  }

  const filename = canonicalEnvFilename(filepath)

  // .env
  if (filename === '.env') {
    return {
      publicKeyName: 'DOTENV_PUBLIC_KEY',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      keyCustodyName: 'DOTENV_KEY_CUSTODY'
    }
  }

  // .env.ENVIRONMENT
  const resolvedEnvironment = environment(filename).toUpperCase()

  return {
    publicKeyName: `DOTENV_PUBLIC_KEY_${resolvedEnvironment}`,
    privateKeyName: `DOTENV_PRIVATE_KEY_${resolvedEnvironment}`,
    keyCustodyName: `DOTENV_KEY_CUSTODY_${resolvedEnvironment}`
  }
}

module.exports = keynames
module.exports.keynames = keynames
