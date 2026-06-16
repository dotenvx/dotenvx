const t = require('tap')

const sanitizeCommandForMetadata = require('../../../src/lib/helpers/sanitizeCommandForMetadata')

t.test('sanitizeCommandForMetadata redacts token flag values', ct => {
  ct.equal(
    sanitizeCommandForMetadata(['keypair', '--token', 'token-123', '-f', '.env.production']),
    'keypair --token [REDACTED] -f .env.production'
  )
  ct.equal(
    sanitizeCommandForMetadata(['keypair', '--token=token-123', '-f', '.env.production']),
    'keypair --token=[REDACTED] -f .env.production'
  )
  ct.equal(
    sanitizeCommandForMetadata('keypair --token token-123 -f .env.production'),
    'keypair --token [REDACTED] -f .env.production'
  )
  ct.end()
})
