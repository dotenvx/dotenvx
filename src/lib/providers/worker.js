const { runAsWorker } = require('synckit')

runAsWorker(async (providerPath, publicKeyHex) => {
  const provider = require(providerPath)
  return provider(publicKeyHex)
})
