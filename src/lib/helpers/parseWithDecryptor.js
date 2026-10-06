const { parse, parseSync, parsearrays, publickeys } = require('@dotenvx/primitives')
const { file } = require('@dotenvx/providers')
const SERVER_SIDE_DECRYPTION_REQUIRED = 'SERVER_SIDE_DECRYPTION_REQUIRED'

function withFileKeys (src, options, sync = false) {
  const keys = file({ fk: options.fk })
  const fallback = options.provider
  const provider = sync
    ? publicKey => {
      const ring = keys.getSync(publicKey)
      return ring[publicKey] ? ring : (fallback ? fallback(publicKey) : {})
    }
    : async publicKey => {
      const ring = await keys.get(publicKey)
      return ring[publicKey] ? ring : (fallback ? fallback(publicKey) : {})
    }
  return {
    ...options,
    provider,
    // Provider lookup requires a public key. Keep legacy key discovery for
    // encrypted files that do not declare one, and for error recovery.
    fk: publickeys(src).length ? [] : options.fk,
    fallbackFk: options.fk
  }
}

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
    fk: options.fallbackFk,
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
  return parseWith(src, options, parse)
}

parseWithDecryptor.arrays = async function parsearraysWithDecryptor (src, options = {}) {
  return parseWith(src, options, parsearrays)
}

async function parseWith (src, options, parser) {
  options = withFileKeys(src, options)
  try {
    return await parser(src, options)
  } catch (error) {
    if (error.code !== SERVER_SIDE_DECRYPTION_REQUIRED || typeof options.decryptor !== 'function') {
      if (typeof options.provider !== 'function') throw error

      const result = await parser(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, error)
    }

    try {
      const result = await options.decryptor(src, decryptOptions(error))
      return await parser(result.src, parseOptionsWithoutProvider(options))
    } catch (decryptorError) {
      const result = await parser(src, parseOptionsWithoutProvider(options))
      return failedKeyAccessFallback(result, decryptorError)
    }
  }
}

parseWithDecryptor.sync = function parseWithDecryptorSync (src, options = {}) {
  options = withFileKeys(src, options, true)
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
