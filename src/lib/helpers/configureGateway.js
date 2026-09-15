const path = require('node:path')
const startBroker = require('./gatewayBroker')

module.exports = async function configureGateway (commandArgs, env, credentials = [], session, explicitToken) {
  const active = credentials.filter(credential => env[credential.name] === credential.placeholder)
  if (active.length === 0) return { commandArgs, env }
  const token = explicitToken || session.token()
  if (!token || token.startsWith('encrypted:')) throw new Error('Stripe gateway requires Armor login. Run [dotenvx armor login].')
  const hostname = session.hostname()
  const url = new URL(hostname)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Stripe gateway requires an HTTPS Armor hostname.')
  }
  const broker = await startBroker({ credentials: active, token, hostname: url.href.replace(/\/$/, ''), devicePublicKey: session.devicePublicKey() })
  const preload = require.resolve('./gatewayPreload')
  const nodeOptions = `${env.NODE_OPTIONS || ''} --require ${JSON.stringify(preload)}`.trim()
  const args = /\.(mjs|cjs|js)$/.test(commandArgs[0])
    ? [process.pkg ? 'node' : process.execPath, path.resolve(commandArgs[0]), ...commandArgs.slice(1)]
    : commandArgs
  return {
    commandArgs: args,
    close: broker.close,
    env: {
      ...env,
      NODE_OPTIONS: nodeOptions,
      DOTENVX_GATEWAY_SOCKET: broker.socketPath,
      DOTENVX_GATEWAY_CONFIG: undefined,
      DOTENVX_TOKEN: undefined,
      DOTENVX_ARMOR_TOKEN: undefined
    }
  }
}
