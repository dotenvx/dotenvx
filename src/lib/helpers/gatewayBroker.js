const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomBytes } = require('node:crypto')
const forward = require('./gatewayForward')

const REQUEST_LIMIT = 256 * 1024
const RESPONSE_LIMIT = 2 * 1024 * 1024
const RESPONSE_HEADERS = ['content-type', 'request-id', 'retry-after', 'stripe-version']

module.exports = async function startBroker (config, nativeFetch) {
  const fetch = forward(config, nativeFetch)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dxg-'))
  fs.chmodSync(directory, 0o700)
  const socketPath = process.platform === 'win32'
    ? `\\\\.\\pipe\\dotenvx-${randomBytes(24).toString('hex')}`
    : path.join(directory, 'broker.sock')
  const removeSocket = () => fs.rmSync(directory, { recursive: true, force: true })
  const server = http.createServer(async (req, res) => {
    const controller = new AbortController()
    res.on('close', () => { if (!res.writableEnded) controller.abort() })
    try {
      const url = new URL(req.headers['dotenvx-upstream-url'])
      if (req.url !== '/' || req.headers.origin || url.origin !== 'https://api.stripe.com' || url.username || url.password || url.hash ||
          !['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.writeHead(403).end('Gateway request is not allowed.')
        return
      }
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > REQUEST_LIMIT) {
          res.writeHead(413).end('Gateway request exceeds 256 KiB.')
          return
        }
        chunks.push(chunk)
      }
      const headers = new Headers()
      for (const name of ['authorization', 'content-type', 'accept', 'idempotency-key', 'stripe-version', 'stripe-account']) {
        if (req.headers[name]) headers.set(name, req.headers[name])
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
      // Only pass API response metadata, never broker configuration or request headers.
      for (const name of RESPONSE_HEADERS) {
        if (response.headers.has(name)) res.setHeader(name, response.headers.get(name))
      }
      res.writeHead(response.status).end(Buffer.concat(output))
    } catch {
      if (!res.headersSent) res.writeHead(502)
      res.end('Gateway request failed.')
    }
  })
  server.requestTimeout = 30000
  server.headersTimeout = 10000
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(socketPath, () => {
        server.removeListener('error', reject)
        resolve()
      })
    })
  } catch (error) {
    removeSocket()
    throw error
  }
  return {
    socketPath,
    close: async () => {
      await new Promise(resolve => {
        server.close(resolve)
        server.closeAllConnections()
      })
      removeSocket()
    }
  }
}
