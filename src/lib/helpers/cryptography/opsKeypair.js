const Ops = require('../../extensions/ops')

async function opsKeypair (existingPublicKey, options = {}) {
  const hooks = options.hooks || {}
  if (hooks.before) await hooks.before()

  const keypairOptions = {}
  if (options.token) keypairOptions.token = options.token
  if (hooks.onStderr) keypairOptions.onStderr = hooks.onStderr
  if (hooks.before || hooks.onStderr || hooks.after) keypairOptions.noSpinner = true

  let kp
  try {
    if (Object.keys(keypairOptions).length > 0) {
      kp = await new Ops().keypair(existingPublicKey, keypairOptions)
    } else {
      kp = await new Ops().keypair(existingPublicKey)
    }
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

module.exports = opsKeypair
