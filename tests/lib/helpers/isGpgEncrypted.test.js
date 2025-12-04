const t = require('tap')

const isGpgEncrypted = require('../../../src/lib/helpers/isGpgEncrypted')

t.test('#isGpgEncrypted', ct => {
  ct.test('returns true for gpg:encrypted: prefixed value', ct => {
    const value = 'gpg:encrypted:hQIMA...'
    ct.equal(isGpgEncrypted(value), true)
    ct.end()
  })

  ct.test('returns false for ecies encrypted: prefixed value', ct => {
    const value = 'encrypted:BE9Y7LKANx77X1pv...'
    ct.equal(isGpgEncrypted(value), false)
    ct.end()
  })

  ct.test('returns false for plain text value', ct => {
    const value = 'hello world'
    ct.equal(isGpgEncrypted(value), false)
    ct.end()
  })

  ct.test('returns false for empty string', ct => {
    ct.equal(isGpgEncrypted(''), false)
    ct.end()
  })

  ct.test('returns false for non-string values', ct => {
    ct.equal(isGpgEncrypted(null), false)
    ct.equal(isGpgEncrypted(undefined), false)
    ct.equal(isGpgEncrypted(123), false)
    ct.equal(isGpgEncrypted({}), false)
    ct.end()
  })

  ct.test('exports GPG_PREFIX constant', ct => {
    ct.equal(isGpgEncrypted.GPG_PREFIX, 'gpg:encrypted:')
    ct.end()
  })

  ct.end()
})
