const selectKeyStorage = require('./selectKeyStorage')
const custodians = require('../custodians')

async function storeKeyStorage (storage, publicKey, privateKey, options, context) {
  while (true) {
    storage = storage || await selectKeyStorage(options)
    try {
      const stored = await custodians.store(storage, publicKey, privateKey, { ...context, allowCustodyBack: true })
      return { storage, stored }
    } catch (error) {
      if (error.code !== 'KEY_CUSTODY_BACK') throw error
      storage = undefined
    }
  }
}

module.exports = storeKeyStorage
