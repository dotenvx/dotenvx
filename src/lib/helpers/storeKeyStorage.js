const selectKeyStorage = require('./selectKeyStorage')
const prompts = require('./prompts')
const createSpinner = require('./createSpinner')
const custodians = require('../custodians')
const { keypair, encrypt } = require('@dotenvx/primitives')
const Session = require('../../db/session')
const PostConnectionKeypair = require('../api/postConnectionKeypair')

async function storeKeyStorage (storage, publicKey, privateKey, options, context) {
  context.allowCustodyBack = true
  while (true) {
    storage = storage || await selectKeyStorage(options)
    if (storage.id === 'enclaved') {
      let privateKeyName
      createSpinner.pause()
      try {
        privateKeyName = await prompts.input({ message: 'Private key name', initial: context.privateKeyName }, context)
      } finally {
        createSpinner.resume()
      }
      const session = new Session()
      const result = await new PostConnectionKeypair(session.hostname(), options.token || session.token(), storage, privateKeyName).run()
      const remotePublicKey = result.keypair?.public_key
      if (typeof remotePublicKey !== 'string' || !/^(?:0[23][0-9a-f]{64}|04[0-9a-f]{128})$/i.test(remotePublicKey)) throw new Error('Invalid public key returned by Armor')
      encrypt(remotePublicKey, '')
      return { storage, stored: {}, publicKey: remotePublicKey }
    }
    if (!publicKey) ({ publicKey, privateKey } = keypair())
    try {
      const stored = await custodians.store(storage, publicKey, privateKey, context)
      return { storage, stored, publicKey }
    } catch (error) {
      if (error.code !== 'KEY_CUSTODY_BACK') throw error
      storage = undefined
    }
  }
}

module.exports = storeKeyStorage
