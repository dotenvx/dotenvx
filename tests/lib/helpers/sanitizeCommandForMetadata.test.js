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

t.test('sanitizeCommandForMetadata redacts common secret flag values', ct => {
  ct.equal(
    sanitizeCommandForMetadata(['login', '--password', 'super-secret', '--api-key=api-key-123', '--private-key', 'private-key-123']),
    'login --password [REDACTED] --api-key=[REDACTED] --private-key [REDACTED]'
  )
  ct.equal(
    sanitizeCommandForMetadata(['login', '--client-secret', 'secret-123', '--refresh-token=refresh-123']),
    'login --client-secret [REDACTED] --refresh-token=[REDACTED]'
  )
  ct.equal(
    sanitizeCommandForMetadata(['login', '--passphrase', 'secret words', '-f', '.env.production']),
    'login --passphrase [REDACTED] -f .env.production'
  )
  ct.end()
})

t.test('sanitizeCommandForMetadata parses quoted string command values before redacting', ct => {
  ct.equal(
    sanitizeCommandForMetadata('login --password "secret words" --api-key api-key-123 -f .env.production'),
    'login --password [REDACTED] --api-key [REDACTED] -f .env.production'
  )
  ct.equal(
    sanitizeCommandForMetadata("login --private-key 'private key words' --team dotenvx"),
    'login --private-key [REDACTED] --team dotenvx'
  )
  ct.end()
})
