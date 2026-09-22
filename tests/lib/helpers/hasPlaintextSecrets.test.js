const t = require('tap')
const hasPlaintextSecrets = require('../../../src/lib/helpers/hasPlaintextSecrets')
const { check } = require('../../../src/cli/actions/protectStdin')

t.test('protection allows secret references without resolving them', ct => {
  const src = 'PASSWORD=op://vault/item/password\nLOGIN="bw://My GitHub Account/username"\n'
  ct.equal(hasPlaintextSecrets(src), false)
  ct.equal(check('.env', Buffer.from(src)), true)
  ct.end()
})

t.test('references do not hide plaintext assignments', ct => {
  for (const reference of ['op://vault/item/password', 'bw://item/password']) {
    ct.equal(hasPlaintextSecrets(`SECRET=${reference}\nOTHER=plaintext`), true)
    ct.equal(hasPlaintextSecrets(`SECRET=plaintext\nSECRET=${reference}`), true)
    ct.equal(hasPlaintextSecrets(`SECRET=${reference}\nSECRET=plaintext`), true)
  }
  ct.end()
})

t.test('only supported literal prefixes are exempt', ct => {
  // These are literal dotenv expressions, not JavaScript interpolation.
  // eslint-disable-next-line no-template-curly-in-string
  for (const value of ['op\\://vault/item/password', 'OP://vault/item/password', 'BW://item/password', 'https://example.com', 'prefix-op://vault/item/password', '$(some-command)', '${OTHER}']) {
    ct.equal(hasPlaintextSecrets(`SECRET=${value}`), true, value)
  }
  ct.end()
})

t.test('existing protection exemptions still apply', ct => {
  ct.equal(hasPlaintextSecrets('EMPTY=\nWHITESPACE=" "\nSECRET=encrypted:abc\nDOTENV_PUBLIC_KEY=public\nVISIBLE_PLAIN=value'), false)
  ct.equal(hasPlaintextSecrets('SECRET=plaintext'), true)
  ct.end()
})
