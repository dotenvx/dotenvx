// Other runtimes use standard proxy/CA variables. Node also needs a bridge for
// older runtimes and core HTTP clients that do not read proxy variables.
if (process.env.DOTENVX_PROXY_URL) {
  const http = require('node:http')
  if (typeof http.setGlobalProxyFromEnv === 'function') {
    http.setGlobalProxyFromEnv()
  } else {
    const { ProxyAgent, Agent, Dispatcher, setGlobalDispatcher } = require('undici')
    const proxy = new ProxyAgent(process.env.DOTENVX_PROXY_URL)
    const direct = new Agent()
    class ProxyDispatcher extends Dispatcher {
      dispatch (options, handler) {
        const host = new URL(options.origin).hostname
        return (['localhost', '127.0.0.1', '[::1]'].includes(host) ? direct : proxy).dispatch(options, handler)
      }
    }
    setGlobalDispatcher(new ProxyDispatcher())
  }
  const { createGlobalProxyAgent } = require('global-agent')
  createGlobalProxyAgent({ environmentVariableNamespace: '', forceGlobalAgent: true })
}
