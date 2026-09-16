const { mutateKeysSrc } = require('../../helpers/cryptography')

// File keys are loaded by envResolution before provider lookup. Creation is
// staged here so the caller can commit .env.keys with the encrypted env files.
module.exports = {
  id: 'file',
  name: 'File (.env.keys)',
  enabled: () => true,
  available: () => true,
  store (publicKey, privateKey, context) {
    return mutateKeysSrc({
      keysSrc: context.keysSrc,
      privateKeyName: context.privateKeyName,
      privateKeyValue: privateKey,
      comment: context.comment
    })
  }
}
