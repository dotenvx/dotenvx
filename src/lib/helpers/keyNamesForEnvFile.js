const canonicalEnvFilename = require('./canonicalEnvFilename')

function environment (filepath) {
  const filename = canonicalEnvFilename(filepath)

  const parts = filename.split('.')
  const possibleEnvironmentList = [...parts.slice(2)]

  if (possibleEnvironmentList.length === 0) {
    // handle .env1 -> development1
    return filename.replace('.env', 'development')
  }

  if (possibleEnvironmentList.length === 1) {
    return possibleEnvironmentList[0]
  }

  if (possibleEnvironmentList.length === 2) {
    return possibleEnvironmentList.join('_')
  }

  return possibleEnvironmentList.slice(0, 2).join('_')
}

function keyNamesForEnvFile (filepath = '.env') {
  const filename = canonicalEnvFilename(filepath)

  if (filename === '.env') {
    return {
      publicKeyName: 'DOTENV_PUBLIC_KEY',
      privateKeyName: 'DOTENV_PRIVATE_KEY'
    }
  }

  const resolvedEnvironment = environment(filename).toUpperCase()

  return {
    publicKeyName: `DOTENV_PUBLIC_KEY_${resolvedEnvironment}`,
    privateKeyName: `DOTENV_PRIVATE_KEY_${resolvedEnvironment}`
  }
}

module.exports = keyNamesForEnvFile
