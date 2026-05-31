const Armor = require('../../extensions/armor')

function armorKeypairSync (existingPublicKey, options = {}) {
  const kp = new Armor().keypairSync(existingPublicKey, options)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = armorKeypairSync
