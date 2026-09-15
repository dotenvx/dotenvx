const { randomBytes } = require('node:crypto')
const { scan, upsert, encrypted } = require('@dotenvx/primitives')

// Remove gateway credentials before any local or Armor decryption is attempted.
module.exports = function prepareGateway (src, credentials, processEnv = {}, gatewayKeys = new Set()) {
  const { parsed } = scan(src)
  const publicKeys = Object.entries(parsed).filter(([name]) => name.startsWith('DOTENV_PUBLIC_KEY'))
  for (const [name, values] of Object.entries(parsed)) {
    if (!gatewayKeys.has(name)) continue
    const replaced = values.map(value => {
      if (!encrypted(value)) return value
      if (publicKeys.length > 1) throw new Error('Stripe gateway requires an unambiguous DOTENV_PUBLIC_KEY in its env file.')
      const publicKey = publicKeys.length === 1 ? publicKeys[0][1].at(-1) : processEnv.DOTENV_PUBLIC_KEY
      if (!publicKey || !/^(02|03)[0-9a-f]{64}$/i.test(publicKey)) {
        throw new Error('Stripe gateway requires DOTENV_PUBLIC_KEY alongside STRIPE_SECRET_KEY.')
      }
      const placeholder = `dotenvx_gateway_${randomBytes(24).toString('hex')}`
      credentials.push({ name, placeholder, ciphertext: value, publicKey })
      return placeholder
    })
    src = upsert(src, name, replaced)
  }
  return src
}
