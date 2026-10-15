const { request } = require('@dotenvx/tooling')
const { isNetworkError } = require('@dotenvx/providers')

async function http (url, opts = {}) {
  try {
    return await request(url, opts)
  } catch (error) {
    if (!isNetworkError(error)) throw error
    const code = error.code || error.cause?.code || 'NETWORK_ERROR'
    throw Object.assign(new Error(`[${code}] unable to connect to ${new URL(url).origin}. Check your connection and that the server is running.`), { code, cause: error })
  }
}

module.exports = { http }
