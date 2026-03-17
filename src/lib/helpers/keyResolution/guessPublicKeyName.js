const path = require('path')
const guessEnvironment = require('./../envResolution/guessEnvironment')

function guessPublicKeyName (filepath) {
  const filename = path.basename(filepath).toLowerCase()

  // .env
  if (filename === '.env') {
    return 'DOTENV_PUBLIC_KEY'
  }

  // .env.ENVIRONMENT
  const environment = guessEnvironment(filename)

  return `DOTENV_PUBLIC_KEY_${environment.toUpperCase()}`
}

module.exports = guessPublicKeyName
