const { runAsWorker } = require('@dotenvx/tooling')
const provider = require('../custodians/managed/armor').get

runAsWorker(async (publicKeyHex) => {
  return provider(publicKeyHex)
})
