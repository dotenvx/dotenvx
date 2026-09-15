// Parent-only forwarding. Never load credential configuration into the application.
function install (config, nativeFetch = globalThis.fetch) {
  if (typeof nativeFetch !== 'function') throw new Error('Stripe gateway requires Node.js with built-in fetch.')
  return async function gatewayFetch (input, init) {
    const url = new URL(input instanceof Request ? input.url : input)
    if (url.hostname !== 'api.stripe.com') return nativeFetch(input, init)
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) {
      throw new Error('Stripe gateway requests must use HTTPS on port 443.')
    }
    const request = new Request(input, init)
    const authorization = request.headers.get('authorization') || ''
    let placeholder
    let scheme
    if (authorization.startsWith('Bearer ')) {
      scheme = 'Bearer'
      placeholder = authorization.slice(7)
    } else if (authorization.startsWith('Basic ')) {
      scheme = 'Basic'
      const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8')
      if (decoded.endsWith(':')) placeholder = decoded.slice(0, -1)
    }
    const credential = config.credentials.find(item => item.placeholder === placeholder)
    if (!credential) throw new Error('Stripe gateway authorization must use STRIPE_SECRET_KEY loaded by dotenvx run.')
    const headers = new Headers()
    for (const name of ['content-type', 'accept', 'idempotency-key', 'stripe-version', 'stripe-account']) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name))
    }
    headers.set('Authorization', `Bearer ${config.token}`)
    headers.set('dotenvx-upstream-host', 'api.stripe.com')
    headers.set('dotenvx-upstream-authorization', scheme === 'Basic'
      ? `Basic ${Buffer.from(`${credential.ciphertext}:`).toString('base64')}`
      : `Bearer ${credential.ciphertext}`)
    if (config.devicePublicKey) headers.set('dotenvx-device-public-key', config.devicePublicKey)
    return nativeFetch(`${config.hostname}/api/gateway/${credential.publicKey}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: request.signal,
      redirect: 'error'
    })
  }
}

module.exports = install
