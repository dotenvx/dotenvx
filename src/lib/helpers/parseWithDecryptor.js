const { parse, parseSync } = require('@dotenvx/primitives')
const SERVER_SIDE_DECRYPTION_REQUIRED = 'SERVER_SIDE_DECRYPTION_REQUIRED'

function decryptOptions (error) {
  const meta = error.meta || {}

  return {
    publicKey: meta.public_key,
    grantToken: meta.grant_token,
    error
  }
}

function parseOptionsWithoutProvider (options) {
  return {
    ...options,
    provider: null,
    decryptor: null
  }
}

function failedKeyAccessFallback (result, error) {
  return {
    ...result,
    errors: [error, ...(result.errors || [])]
  }
}

async function parseWithDecryptor (src, options = {}) {
  try {
    return await parse(src, options)
  } catch (error) {
    if (error.code !== SERVER_SIDE_DECRYPTION_REQUIRED || typeof options.decryptor !== 'function') {
      if (typeof options.provider !== 'function') throw error

      const result = await parse(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, error)
    }

    try {
      const result = await options.decryptor(src, decryptOptions(error))
      return await parse(result.src, parseOptionsWithoutProvider(options))
    } catch (decryptorError) {
      const result = await parse(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, decryptorError)
    }
  }
}

parseWithDecryptor.sync = function parseWithDecryptorSync (src, options = {}) {
  try {
    return parseSync(src, options)
  } catch (error) {
    if (error.code !== SERVER_SIDE_DECRYPTION_REQUIRED || typeof options.decryptor !== 'function') {
      if (typeof options.provider !== 'function') throw error

      const result = parseSync(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, error)
    }

    try {
      const result = options.decryptor(src, decryptOptions(error))
      return parseSync(result.src, parseOptionsWithoutProvider(options))
    } catch (decryptorError) {
      const result = parseSync(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, decryptorError)
    }
  }
}

module.exports = parseWithDecryptor
