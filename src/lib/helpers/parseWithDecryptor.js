const { parse, parseSync, parsearrays, scan, encrypted } = require('@dotenvx/primitives')
const prepareProxy = require('../proxy/prepareProxy')
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
  if (options.proxyCredentials) {
    const original = src
    src = prepareProxy(src, options.proxyCredentials, options.processEnv, options.proxyRules)
    if (src !== original && !Object.values(scan(src).parsed).flat().some(encrypted)) {
      options = parseOptionsWithoutProvider(options)
    }
  }
  return parseWith(src, options, parse)
}

parseWithDecryptor.arrays = async function parsearraysWithDecryptor (src, options = {}) {
  return parseWith(src, options, parsearrays)
}

async function parseWith (src, options, parser) {
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
