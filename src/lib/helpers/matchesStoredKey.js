const { derive } = require('@dotenvx/primitives')

// Locked values can be transported without unlocking. Validate the envelope
// here; authenticate and derive the actual key when unlocking for use.
function matchesStoredKey (publicKey, value) {
  if (typeof value !== 'string') return false
  if (value.startsWith('locked:')) {
    const parts = value.split(':')
    if (parts.length !== 3 || parts[1] !== publicKey || !/^(02|03)[a-f0-9]{64}$/i.test(publicKey)) return false
    const payload = Buffer.from(parts[2], 'base64url')
    return payload.length === 109 && payload[0] === 1 && payload.toString('base64url') === parts[2]
  }
  try { return derive(value) === publicKey } catch { return false }
}

module.exports = matchesStoredKey
