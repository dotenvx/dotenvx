const t = require('tap')

const getGpgRecipient = require('../../../src/lib/helpers/getGpgRecipient')

t.test('#getGpgRecipient', ct => {
  const originalGpgKey = process.env.DOTENV_GPG_KEY
  const originalGpgKeyProd = process.env.DOTENV_GPG_KEY_PRODUCTION

  ct.afterEach(() => {
    // Restore original env
    if (originalGpgKey === undefined) {
      delete process.env.DOTENV_GPG_KEY
    } else {
      process.env.DOTENV_GPG_KEY = originalGpgKey
    }
    if (originalGpgKeyProd === undefined) {
      delete process.env.DOTENV_GPG_KEY_PRODUCTION
    } else {
      process.env.DOTENV_GPG_KEY_PRODUCTION = originalGpgKeyProd
    }
  })

  ct.test('returns null when no recipient specified', ct => {
    delete process.env.DOTENV_GPG_KEY
    const result = getGpgRecipient({})
    ct.equal(result, null)
    ct.end()
  })

  ct.test('returns gpgKey from options', ct => {
    delete process.env.DOTENV_GPG_KEY
    const result = getGpgRecipient({ gpgKey: 'user@example.com' })
    ct.equal(result, 'user@example.com')
    ct.end()
  })

  ct.test('returns DOTENV_GPG_KEY from env', ct => {
    process.env.DOTENV_GPG_KEY = 'env-user@example.com'
    const result = getGpgRecipient({})
    ct.equal(result, 'env-user@example.com')
    ct.end()
  })

  ct.test('options.gpgKey takes precedence over env', ct => {
    process.env.DOTENV_GPG_KEY = 'env-user@example.com'
    const result = getGpgRecipient({ gpgKey: 'option-user@example.com' })
    ct.equal(result, 'option-user@example.com')
    ct.end()
  })

  ct.test('returns environment-specific key for .env.production', ct => {
    delete process.env.DOTENV_GPG_KEY
    process.env.DOTENV_GPG_KEY_PRODUCTION = 'prod-user@example.com'
    const result = getGpgRecipient({}, '.env.production')
    ct.equal(result, 'prod-user@example.com')
    ct.end()
  })

  ct.test('falls back to generic DOTENV_GPG_KEY if env-specific not found', ct => {
    process.env.DOTENV_GPG_KEY = 'generic@example.com'
    delete process.env.DOTENV_GPG_KEY_PRODUCTION
    const result = getGpgRecipient({}, '.env.production')
    ct.equal(result, 'generic@example.com')
    ct.end()
  })

  ct.test('options.gpgKey takes precedence over env-specific key', ct => {
    process.env.DOTENV_GPG_KEY_PRODUCTION = 'prod-user@example.com'
    const result = getGpgRecipient({ gpgKey: 'option@example.com' }, '.env.production')
    ct.equal(result, 'option@example.com')
    ct.end()
  })

  ct.test('handles .env file without environment suffix', ct => {
    delete process.env.DOTENV_GPG_KEY
    const result = getGpgRecipient({}, '.env')
    ct.equal(result, null)
    ct.end()
  })

  ct.end()
})
