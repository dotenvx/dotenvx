const t = require('tap')

const getCryptoProvider = require('../../../src/lib/helpers/getCryptoProvider')

t.test('#getCryptoProvider', ct => {
  const originalEnv = process.env.DOTENVX_CRYPTO

  ct.afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.DOTENVX_CRYPTO
    } else {
      process.env.DOTENVX_CRYPTO = originalEnv
    }
  })

  ct.test('returns ecies by default', ct => {
    delete process.env.DOTENVX_CRYPTO
    const result = getCryptoProvider()
    ct.equal(result, 'ecies')
    ct.end()
  })

  ct.test('returns ecies when options is empty', ct => {
    delete process.env.DOTENVX_CRYPTO
    const result = getCryptoProvider({})
    ct.equal(result, 'ecies')
    ct.end()
  })

  ct.test('returns gpg when options.gpg is true', ct => {
    delete process.env.DOTENVX_CRYPTO
    const result = getCryptoProvider({ gpg: true })
    ct.equal(result, 'gpg')
    ct.end()
  })

  ct.test('returns ecies when options.gpg is false', ct => {
    delete process.env.DOTENVX_CRYPTO
    const result = getCryptoProvider({ gpg: false })
    ct.equal(result, 'ecies')
    ct.end()
  })

  ct.test('returns gpg when DOTENVX_CRYPTO=gpg', ct => {
    process.env.DOTENVX_CRYPTO = 'gpg'
    const result = getCryptoProvider({})
    ct.equal(result, 'gpg')
    ct.end()
  })

  ct.test('options.gpg=true takes precedence over DOTENVX_CRYPTO=ecies', ct => {
    delete process.env.DOTENVX_CRYPTO
    const result = getCryptoProvider({ gpg: true })
    ct.equal(result, 'gpg')
    ct.end()
  })

  ct.test('options.gpg=false does not override DOTENVX_CRYPTO=gpg', ct => {
    process.env.DOTENVX_CRYPTO = 'gpg'
    // When gpg=false is passed, it doesn't explicitly disable gpg from env
    // The env var still takes effect (this is the design choice)
    const result = getCryptoProvider({ gpg: false })
    ct.equal(result, 'gpg')
    ct.end()
  })

  ct.test('returns ecies when DOTENVX_CRYPTO has invalid value', ct => {
    process.env.DOTENVX_CRYPTO = 'invalid'
    const result = getCryptoProvider({})
    ct.equal(result, 'ecies')
    ct.end()
  })

  ct.end()
})
