const { request } = require('undici')

async function http (url, opts = {}) {
  return await request(url, opts)
}

module.exports = { http }
