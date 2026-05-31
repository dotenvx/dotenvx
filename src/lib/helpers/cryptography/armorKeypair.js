const Armor = require('../../extensions/armor')

async function armorKeypair (existingPublicKey, options = {}) {
  const hooks = options.hooks || {}
  if (hooks.before) await hooks.before()

  const keypairOptions = {
    token: options.token,
    envFilepath: options.envFilepath
  }
  if (hooks.onStderr) keypairOptions.onStderr = hooks.onStderr
  if (hooks.before || hooks.onStderr || hooks.after) keypairOptions.noSpinner = true

  let kp
  try {
    kp = await new Armor().keypair(existingPublicKey, keypairOptions)
  } finally {
    if (hooks.after) await hooks.after()
  }

  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = armorKeypair
