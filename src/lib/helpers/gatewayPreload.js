const http = require('node:http')

// The application knows only the local broker address and its own placeholders.
function install (socketPath, nativeFetch = globalThis.fetch) {
  if (typeof nativeFetch !== 'function') throw new Error('Stripe gateway requires Node.js with built-in fetch.')
  return async function gatewayFetch (input, init) {
    const url = new URL(input instanceof Request ? input.url : input)
    if (url.hostname !== 'api.stripe.com') return nativeFetch(input, init)
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) {
      throw new Error('Stripe gateway requests must use HTTPS on port 443.')
    }
    const request = new Request(input, init)
    const headers = { 'dotenvx-upstream-url': url.href }
    for (const name of ['authorization', 'content-type', 'accept', 'idempotency-key', 'stripe-version', 'stripe-account']) {
      if (request.headers.has(name)) headers[name] = request.headers.get(name)
    }
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.from(await request.arrayBuffer())
    if (body && body.length > 256 * 1024) throw new Error('Gateway request exceeds 256 KiB.')
    return new Promise((resolve, reject) => {
      const connection = http.request({ socketPath, path: '/', method: request.method, headers, signal: request.signal }, response => {
        const chunks = []
        let size = 0
        response.on('data', chunk => {
          size += chunk.length
          if (size > 2 * 1024 * 1024) {
            response.destroy(new Error('Gateway response exceeds 2 MiB.'))
            return
          }
          chunks.push(chunk)
        })
        response.on('error', reject)
        response.on('end', () => {
          const empty = request.method === 'HEAD' || [204, 205, 304].includes(response.statusCode)
          const result = new Response(empty ? null : Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })
          resolve(result)
        })
      })
      connection.on('error', reject)
      connection.end(body)
    })
  }
}

if (process.env.DOTENVX_GATEWAY_SOCKET) {
  globalThis.fetch = install(process.env.DOTENVX_GATEWAY_SOCKET)
}

module.exports = install
