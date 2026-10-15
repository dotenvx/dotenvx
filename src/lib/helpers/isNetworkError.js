const NETWORK_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ENETDOWN',
  'ENETUNREACH',
  'EHOSTDOWN',
  'EHOSTUNREACH',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET'
])

function isNetworkError (error) {
  if (!error) return false
  return NETWORK_ERROR_CODES.has(error.code) || isNetworkError(error.cause) ||
    (Array.isArray(error.errors) && error.errors.some(isNetworkError))
}

module.exports = isNetworkError
