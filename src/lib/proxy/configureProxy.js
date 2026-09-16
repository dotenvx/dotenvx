const path = require('node:path')
const fs = require('node:fs')
const startProxy = require('./proxyServer')

module.exports = async function configureProxy (commandArgs, env, credentials = [], session, explicitToken) {
  const active = credentials.filter(credential => env[credential.name] === credential.placeholder)
  if (active.length === 0) return { commandArgs, env }
  const token = explicitToken || session.token()
  if (!token || token.startsWith('encrypted:')) throw new Error('Credential proxy requires Armor login. Run [dotenvx armor login].')
  const hostname = session.hostname()
  const url = new URL(hostname)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Credential proxy requires an HTTPS Armor hostname.')
  }
  const server = await startProxy({ credentials: active, token, hostname: url.href.replace(/\/$/, ''), devicePublicKey: session.devicePublicKey(), env })
  const preload = path.join(path.dirname(server.caPath), 'proxy-preload.cjs')
  try {
    fs.writeFileSync(preload, require('./proxyPreloadSource'), { mode: 0o600 })
  } catch (error) {
    await server.close()
    throw error
  }
  const nodeOptions = `${env.NODE_OPTIONS || ''} --require ${JSON.stringify(preload)}`.trim()
  const args = /\.(mjs|cjs|js)$/.test(commandArgs[0])
    ? [process.pkg ? 'node' : process.execPath, path.resolve(commandArgs[0]), ...commandArgs.slice(1)]
    : commandArgs
  return {
    commandArgs: args,
    close: server.close,
    env: {
      ...env,
      NODE_OPTIONS: nodeOptions,
      HTTP_PROXY: server.proxyUrl,
      HTTPS_PROXY: server.proxyUrl,
      ALL_PROXY: server.proxyUrl,
      http_proxy: server.proxyUrl,
      https_proxy: server.proxyUrl,
      all_proxy: server.proxyUrl,
      NO_PROXY: 'localhost,127.0.0.1,::1',
      no_proxy: 'localhost,127.0.0.1,::1',
      NODE_EXTRA_CA_CERTS: server.caPath,
      SSL_CERT_FILE: server.caPath,
      REQUESTS_CA_BUNDLE: server.caPath,
      CURL_CA_BUNDLE: server.caPath,
      GIT_SSL_CAINFO: server.caPath,
      CARGO_HTTP_CAINFO: server.caPath,
      DENO_CERT: server.caPath,
      DOTENVX_PROXY_URL: server.proxyUrl,
      DOTENVX_PROXY_SOCKET: undefined,
      DOTENVX_PROXY_CONFIG: undefined,
      DOTENVX_TOKEN: undefined,
      DOTENVX_ARMOR_TOKEN: undefined
    }
  }
}
