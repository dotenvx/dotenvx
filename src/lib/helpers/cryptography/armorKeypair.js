const Armor = require('../../extensions/armor')

async function armorKeypair (existingPublicKey, options = {}) {
  const keypairOptions = {
    token: options.token,
    envFilepath: options.envFilepath,
    command: options.command
  }

  const kp = await new Armor().keypair(existingPublicKey, keypairOptions)

  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = armorKeypair
