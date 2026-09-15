const eligibleHeaders = require('./eligibleHeaders')

// Parent-only forwarding. Never load credential configuration into the application.
function install (config, nativeFetch = globalThis.fetch) {
  if (typeof nativeFetch !== 'function') throw new Error('Credential proxy requires Node.js with built-in fetch.')
  return async function proxyFetch (input, init) {
    const url = new URL(input instanceof Request ? input.url : input)
    if (!config.credentials.some(item => item.host === url.hostname)) return nativeFetch(input, init)
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) {
      throw new Error('Credential proxy requests must use HTTPS on port 443.')
    }
    const request = new Request(input, init)
    const upstreamHeaders = Object.fromEntries([...request.headers].filter(([name]) => eligibleHeaders(name)))
    const values = Object.entries(upstreamHeaders).map(([name, value]) => {
      // Preserve existing Basic support: its placeholder is encoded on the wire.
      if (name === 'authorization' && value.startsWith('Basic ')) {
        const encoded = value.slice(6)
        const decoded = Buffer.from(encoded, 'base64')
        if (decoded.toString('base64') !== encoded) throw new Error('Invalid Basic authorization.')
        return decoded.toString('utf8')
      }
      return value
    })
    const active = config.credentials.filter(credential => {
      const occurrences = values.reduce((total, value) => total + value.split(credential.placeholder).length - 1, 0)
      if (occurrences && credential.host !== url.hostname) throw new Error('Proxy credential is not allowed at this destination.')
      if (occurrences > 1) throw new Error('Proxy credential must occur in only one eligible header, once.')
      return occurrences === 1
    })
    if (!active.length) throw new Error('Credential proxy requires a proxied environment variable in an eligible header.')
    if (active.length > 8 || active.some(item => item.publicKey !== active[0].publicKey)) {
      throw new Error('Proxy request requires at most eight credentials from the same keypair.')
    }
    const body = ['GET', 'HEAD'].includes(request.method) ? null : Buffer.from(await request.arrayBuffer())
    if (body && body.length > 256 * 1024) throw new Error('Proxy request body exceeds 256 KiB.')
    const credentials = active.map(({ publicKey, placeholder, ciphertext }) => ({ publicKey, placeholder, ciphertext }))
    const metadata = JSON.stringify({ headers: upstreamHeaders, credentials })
    if (Buffer.byteLength(metadata) > 64 * 1024) throw new Error('Proxy request metadata exceeds 64 KiB.')
    const payload = JSON.stringify({
      version: 1,
      request: {
        url: url.href,
        method: request.method,
        headers: upstreamHeaders,
        body: body === null ? null : { encoding: 'base64', data: body.toString('base64') }
      },
      credentials
    })
    if (Buffer.byteLength(payload) > 512 * 1024) throw new Error('Proxy request envelope exceeds 512 KiB.')
    const headers = new Headers({
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    })
    if (config.devicePublicKey) headers.set('dotenvx-device-public-key', config.devicePublicKey)
    return nativeFetch(`${config.hostname}/api/proxy`, {
      method: 'POST',
      headers,
      body: payload,
      signal: request.signal,
      redirect: 'error'
    })
  }
}

module.exports = install
