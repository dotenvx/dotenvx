const t = require('tap')

const { isNetworkError } = require('@dotenvx/providers')

t.test('isNetworkError recognizes direct and wrapped connectivity errors', ct => {
  ct.equal(isNetworkError({ code: 'ENETUNREACH' }), true)
  ct.equal(isNetworkError({ cause: { code: 'ENOTFOUND' } }), true)
  ct.equal(isNetworkError({ code: 'UND_ERR_CONNECT_TIMEOUT' }), true)
  ct.equal(isNetworkError({ code: 'SERVER_SIDE_DECRYPTION_REQUIRED' }), false)
  ct.equal(isNetworkError(new Error('unknown')), false)
  ct.end()
})
