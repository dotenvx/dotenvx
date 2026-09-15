const http = require('node:http')
const https = require('node:https')
const net = require('node:net')
const tls = require('node:tls')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const certificates = require('./proxyCertificates')
const forward = require('./proxyForward')
const eligibleHeaders = require('./eligibleHeaders')

const REQUEST_LIMIT = 256 * 1024
const RESPONSE_LIMIT = 2 * 1024 * 1024
const RESPONSE_HEADERS = ['content-type', 'request-id', 'retry-after', 'stripe-version']

module.exports = async function startProxy (config, nativeFetch) {
  const fetch = forward(config, nativeFetch)
  const hosts = new Set(config.credentials.map(item => item.host))
  const identity = await certificates(hosts.size ? [...hosts] : ['localhost'])
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dxp-'))
  fs.chmodSync(directory, 0o700)
  const caPath = path.join(directory, 'ca.pem')
  const sockets = new Set()
  const track = socket => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', () => {})
    socket.setTimeout(30000, () => socket.destroy())
    return socket
  }
  const reject = socket => socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
  const servers = new Map()
  for (const host of hosts) {
    const secure = https.createServer({ key: identity.key, cert: identity.cert, ALPNProtocols: ['http/1.1'] }, async (req, res) => {
      const controller = new AbortController()
      res.on('close', () => { if (!res.writableEnded) controller.abort() })
      try {
        const url = new URL(req.url, `https://${host}`)
        if (![host, `${host}:443`].includes(req.headers.host?.toLowerCase()) ||
          url.origin !== `https://${host}` || url.username || url.password || url.hash ||
          !req.url.startsWith('/') || req.url.startsWith('//') ||
          !['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          res.writeHead(403).end('Proxy request is not allowed.')
          return
        }
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (size > REQUEST_LIMIT) {
            res.writeHead(413).end('Proxy request exceeds 256 KiB.')
            return
          }
          chunks.push(chunk)
        }
        const headers = new Headers()
        for (const [name, value] of Object.entries(req.headers)) {
          if (eligibleHeaders(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
        }
        const response = await fetch(url.href, {
          method: req.method,
          headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          signal: controller.signal
        })
        const output = []
        let bytes = 0
        if (response.body) {
          for await (const chunk of response.body) {
            bytes += chunk.length
            if (bytes > RESPONSE_LIMIT) throw new Error('response too large')
            output.push(Buffer.from(chunk))
          }
        }
        for (const name of RESPONSE_HEADERS) {
          if (response.headers.has(name)) res.setHeader(name, response.headers.get(name))
        }
        res.writeHead(response.status).end(Buffer.concat(output))
      } catch {
        if (!res.headersSent) res.writeHead(502)
        res.end('Proxy request failed.')
      }
    })
    secure.on('secureConnection', track)
    secure.on('tlsClientError', (_error, socket) => socket.destroy())
    secure.on('upgrade', (_req, socket) => reject(socket))
    secure.requestTimeout = 30000
    secure.headersTimeout = 10000
    servers.set(host, secure)
  }

  const server = http.createServer((req, res) => {
    // Ordinary HTTP is forwarded without injecting any proxy credential.
    let url
    try { url = new URL(req.url) } catch { res.writeHead(400).end(); return }
    if (url.protocol !== 'http:' || url.username || url.password || hosts.has(url.hostname) || self(url)) {
      res.writeHead(403).end('Proxy request is not allowed.')
      return
    }
    const headers = { ...req.headers, host: url.host }
    for (const name of ['proxy-authorization', 'proxy-connection', 'connection']) delete headers[name]
    const upstream = http.request(url, { method: req.method, headers, agent: false }, response => {
      const responseHeaders = { ...response.headers }
      delete responseHeaders['proxy-authenticate']
      res.writeHead(response.statusCode, responseHeaders)
      response.pipe(res)
      response.on('error', () => res.destroy())
    })
    upstream.on('socket', track)
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Proxy request failed.') })
    res.on('close', () => upstream.destroy())
    req.pipe(upstream)
  })
  function self (url) {
    return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && Number(url.port) === server.address()?.port
  }
  server.on('connection', track)
  server.on('upgrade', (_req, socket) => reject(socket))
  server.on('connect', (req, socket, head) => {
    let target
    try {
      if (!/^(\[[\da-f:]+\]|[a-z\d.-]+):\d+$/i.test(req.url)) throw new Error('invalid authority')
      target = new URL(`https://${req.url}`)
      if (self(target)) throw new Error('proxy loop')
    } catch { reject(socket); return }
    if (hosts.has(target.hostname)) {
      if (target.port && target.port !== '443') { reject(socket); return }
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) socket.unshift(head)
      servers.get(target.hostname).emit('connection', socket)
      return
    }
    // Unmanaged HTTPS remains end-to-end encrypted through a standard CONNECT tunnel.
    const upstream = track(net.connect(Number(target.port) || 443, target.hostname.replace(/^\[|\]$/g, '')))
    upstream.on('connect', () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) upstream.write(head)
      socket.pipe(upstream).pipe(socket)
    })
    upstream.on('error', () => socket.destroy())
    socket.on('close', () => upstream.destroy())
    upstream.on('close', () => socket.destroy())
  })
  server.requestTimeout = 30000
  server.headersTimeout = 10000
  let closed
  const close = () => {
    if (!closed) {
      closed = (async () => {
        for (const socket of sockets) socket.destroy()
        await new Promise(resolve => server.close(resolve))
        fs.rmSync(directory, { recursive: true, force: true })
      })()
    }
    return closed
  }
  try {
    const roots = typeof tls.getCACertificates === 'function' ? tls.getCACertificates('default') : tls.rootCertificates
    const trust = new Set(roots)
    const env = config.env || {}
    for (const name of ['NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'GIT_SSL_CAINFO', 'CARGO_HTTP_CAINFO', 'DENO_CERT']) {
      if (env[name]) trust.add(fs.readFileSync(env[name], 'utf8'))
    }
    trust.add(identity.ca)
    fs.writeFileSync(caPath, [...trust].join('\n'), { mode: 0o600 })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve() })
    })
  } catch (error) {
    await close()
    throw error
  }
  return { proxyUrl: `http://127.0.0.1:${server.address().port}`, caPath, close }
}
