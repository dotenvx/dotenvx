const Ops = require('../../extensions/ops')

async function opsKeypair (existingPublicKey, options = {}) {
  if (options.beforeOpsKeypair) await options.beforeOpsKeypair()

  const keypairOptions = {}
  if (options.token) keypairOptions.token = options.token
  if (options.metadata) keypairOptions.metadata = options.metadata
  if (options.beforeOpsKeypair || options.afterOpsKeypair) keypairOptions.noSpinner = true

  let kp
  try {
    if (Object.keys(keypairOptions).length > 0) {
      kp = await new Ops().keypair(existingPublicKey, keypairOptions)
    } else {
      kp = await new Ops().keypair(existingPublicKey)
    }
  } finally {
    if (options.afterOpsKeypair) await options.afterOpsKeypair()
  }

  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = opsKeypair
