function parseKey (dotenvKey) {
  // parse DOTENV_PUBLIC_KEY or DOTENV_PRIVATE_KEY
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (e) {
    throw new Error(`INVALID_DOTENV_KEY: ${e.message}`)
  }

  // Get envFile
  const envFile = uri.searchParams.get('env-file')
  if (!envFile) {
    throw new Error('INVALID_DOTENV_KEY: Missing url param env-file')
  }

  // Get key
  const key = uri.password
  if (!key) {
    throw new Error('INVALID_DOTENV_KEY: Missing key part')
  }

  return {
    key,
    envFile
  }

}

module.exports = parseKey
