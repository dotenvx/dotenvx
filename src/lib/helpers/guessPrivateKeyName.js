const guessEnvironment = require('./guessEnvironment')

function guessPrivateKeyName (filepath) {
  // .env
  if (filepath.endsWith('.env')) {
    return 'DOTENV_PRIVATE_KEY'
  }

  // .env.ENVIRONMENT
  const environment = guessEnvironment(filepath)

  return `DOTENV_PRIVATE_KEY_${environment.toUpperCase()}`
}

module.exports = guessPrivateKeyName
