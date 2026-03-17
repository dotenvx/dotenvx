const path = require('path')
const guessEnvironment = require('./../envResolution/guessEnvironment')

function guessKeyNames (filepath) {
  const filename = path.basename(filepath).toLowerCase()

  // .env
  if (filename === '.env') {
    return {
      publicKeyName: 'DOTENV_PUBLIC_KEY',
      privateKeyName: 'DOTENV_PRIVATE_KEY'
    }
  }

  // .env.ENVIRONMENT
  const environment = guessEnvironment(filename).toUpperCase()

  return {
    publicKeyName: `DOTENV_PUBLIC_KEY_${environment}`,
    privateKeyName: `DOTENV_PRIVATE_KEY_${environment}`
  }
}

module.exports = guessKeyNames
