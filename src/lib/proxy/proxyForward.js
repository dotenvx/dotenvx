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
    // Separate the original headers from Armor authentication. Radar independently
    // validates this envelope and performs substitution after authorizing decryption.
    const envelope = Buffer.from(JSON.stringify({
      headers: upstreamHeaders,
      credentials: active.map(({ placeholder, ciphertext }) => ({ placeholder, ciphertext }))
    })).toString('base64')
    if (envelope.length > 12 * 1024) throw new Error('Proxy header envelope exceeds 12 KiB.')
    const headers = new Headers({
      Authorization: `Bearer ${config.token}`,
      'dotenvx-upstream-host': url.hostname,
      'dotenvx-upstream-headers': envelope
    })
    if (config.devicePublicKey) headers.set('dotenvx-device-public-key', config.devicePublicKey)
    return nativeFetch(`${config.hostname}/api/gateway/${active[0].publicKey}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: request.signal,
      redirect: 'error'
    })
  }
}

module.exports = install
