const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { encrypt } = require('@dotenvx/primitives')

function serverSideDecryptionRequired () {
  const error = new Error('[SERVER_SIDE_DECRYPTION_REQUIRED] server-side decryption required')
  error.code = 'SERVER_SIDE_DECRYPTION_REQUIRED'
  error.meta = {
    public_key: 'public-key',
    grant_token: 'grant-token-1'
  }
  return error
}

t.test('parseWithDecryptor preserves a real encrypted parse when the Armor provider denies access', async ct => {
  const publicKey = '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498'
  const encryptedValue = encrypt(publicKey, 'hello')
  const src = `DOTENV_PUBLIC_KEY="${publicKey}"\nHELLO="${encryptedValue}"\n`
  const permissionError = new Error('[PERMISSION_DENIED] ask an owner or admin for armored key access (02B 106)')
  permissionError.code = 'PERMISSION_DENIED'
  const provider = sinon.stub().rejects(permissionError)
  const parseWithDecryptor = require('../../../src/lib/helpers/parseWithDecryptor')

  const result = await parseWithDecryptor(src, { provider })

  ct.same(result.parsed, { DOTENV_PUBLIC_KEY: publicKey, HELLO: encryptedValue })
  ct.equal(result.errors[0], permissionError)
  ct.equal(result.errors[1].code, 'DECRYPTION_FAILED')
  ct.equal(provider.callCount, 1)
  ct.end()
})

t.test('parseWithDecryptor delegates server-side decryption and reparses plaintext', async ct => {
  const error = serverSideDecryptionRequired()
  const parse = sinon.stub()
  parse.onFirstCall().rejects(error)
  parse.onSecondCall().resolves({ parsed: { HELLO: 'World' }, errors: [] })
  const decryptor = sinon.stub().resolves({ src: 'HELLO=World\n' })
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse, parseSync: sinon.stub() }
  })

  const result = await parseWithDecryptor('HELLO=encrypted:ciphertext\n', {
    provider: sinon.stub(),
    decryptor
  })

  ct.same(result, { parsed: { HELLO: 'World' }, errors: [] })
  ct.same(decryptor.firstCall.args, [
    'HELLO=encrypted:ciphertext\n',
    {
      publicKey: 'public-key',
      grantToken: 'grant-token-1',
      error
    }
  ])
  ct.equal(parse.secondCall.args[0], 'HELLO=World\n')
  ct.equal(parse.secondCall.args[1].provider, null)
  ct.equal(parse.secondCall.args[1].decryptor, null)
  ct.end()
})

t.test('parseWithDecryptor rethrows errors that do not request server-side decryption', async ct => {
  const error = new Error('network failed')
  error.code = 'NETWORK_ERROR'
  const parse = sinon.stub().rejects(error)
  const decryptor = sinon.stub()
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse, parseSync: sinon.stub() }
  })

  await ct.rejects(parseWithDecryptor('HELLO=encrypted:ciphertext\n', { decryptor }), error)
  ct.equal(decryptor.callCount, 0)
  ct.end()
})

t.test('parseWithDecryptor preserves encrypted src when a key provider fails', async ct => {
  const permissionError = new Error('[PERMISSION_DENIED] ask an owner or admin for armored key access (029 4B2)')
  permissionError.code = 'PERMISSION_DENIED'
  const parse = sinon.stub()
  const decryptionError = { code: 'DECRYPTION_FAILED', message: 'could not decrypt HELLO' }
  parse.onFirstCall().rejects(permissionError)
  parse.onSecondCall().resolves({
    parsed: { DOTENV_PUBLIC_KEY: '0294b2', HELLO: 'encrypted:ciphertext' },
    errors: [decryptionError]
  })
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse, parseSync: sinon.stub() }
  })

  const result = await parseWithDecryptor('DOTENV_PUBLIC_KEY=0294b2\nHELLO=encrypted:ciphertext\n', {
    provider: sinon.stub(),
    decryptor: sinon.stub()
  })

  ct.same(result.parsed, { DOTENV_PUBLIC_KEY: '0294b2', HELLO: 'encrypted:ciphertext' })
  ct.same(result.errors, [permissionError, decryptionError])
  ct.equal(parse.secondCall.args[1].provider, null)
  ct.equal(parse.secondCall.args[1].decryptor, null)
  ct.end()
})

t.test('parseWithDecryptor preserves encrypted src and the error when the decryptor is offline', async ct => {
  const requiredError = serverSideDecryptionRequired()
  const networkError = new Error('connect ENETUNREACH armor.dotenvx.com')
  networkError.code = 'ENETUNREACH'
  const parse = sinon.stub()
  parse.onFirstCall().rejects(requiredError)
  parse.onSecondCall().resolves({
    parsed: { HELLO: 'encrypted:ciphertext' },
    errors: [{ code: 'DECRYPTION_FAILED', message: 'could not decrypt HELLO' }]
  })
  const decryptor = sinon.stub().rejects(networkError)
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse, parseSync: sinon.stub() }
  })

  const result = await parseWithDecryptor('HELLO=encrypted:ciphertext\n', { decryptor })

  ct.same(result.parsed, { HELLO: 'encrypted:ciphertext' })
  ct.equal(result.errors[0], networkError)
  ct.equal(result.errors[1].code, 'DECRYPTION_FAILED')
  ct.equal(parse.secondCall.args[0], 'HELLO=encrypted:ciphertext\n')
  ct.equal(parse.secondCall.args[1].provider, null)
  ct.end()
})

t.test('parseWithDecryptor preserves encrypted src and the permission error when Armor access is denied', async ct => {
  const requiredError = serverSideDecryptionRequired()
  const permissionError = new Error('[PERMISSION_DENIED] ask an owner or admin for armored key access (029 4B2)')
  permissionError.code = 'PERMISSION_DENIED'
  const parse = sinon.stub()
  const decryptionError = { code: 'DECRYPTION_FAILED', message: 'could not decrypt HELLO' }
  parse.onFirstCall().rejects(requiredError)
  parse.onSecondCall().resolves({
    parsed: { DOTENV_PUBLIC_KEY: '0294b2', HELLO: 'encrypted:ciphertext' },
    errors: [decryptionError]
  })
  const decryptor = sinon.stub().rejects(permissionError)
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse, parseSync: sinon.stub() }
  })

  const result = await parseWithDecryptor('DOTENV_PUBLIC_KEY=0294b2\nHELLO=encrypted:ciphertext\n', { decryptor })

  ct.same(result.parsed, { DOTENV_PUBLIC_KEY: '0294b2', HELLO: 'encrypted:ciphertext' })
  ct.same(result.errors, [permissionError, decryptionError])
  ct.equal(parse.secondCall.args[1].provider, null)
  ct.equal(parse.secondCall.args[1].decryptor, null)
  ct.end()
})

t.test('parseWithDecryptor.sync delegates through a synchronous decryptor', ct => {
  const error = serverSideDecryptionRequired()
  const parseSync = sinon.stub()
  parseSync.onFirstCall().throws(error)
  parseSync.onSecondCall().returns({ parsed: { HELLO: 'World' }, errors: [] })
  const decryptor = sinon.stub().returns({ src: 'HELLO=World\n' })
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse: sinon.stub(), parseSync }
  })

  const result = parseWithDecryptor.sync('HELLO=encrypted:ciphertext\n', { decryptor })

  ct.same(result, { parsed: { HELLO: 'World' }, errors: [] })
  ct.equal(decryptor.callCount, 1)
  ct.equal(parseSync.secondCall.args[1].decryptor, null)
  ct.end()
})

t.test('parseWithDecryptor.sync preserves encrypted src when a key provider fails', ct => {
  const permissionError = new Error('[PERMISSION_DENIED] denied')
  permissionError.code = 'PERMISSION_DENIED'
  const parseSync = sinon.stub()
  parseSync.onFirstCall().throws(permissionError)
  parseSync.onSecondCall().returns({ parsed: { HELLO: 'encrypted:ciphertext' }, errors: [] })
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse: sinon.stub(), parseSync }
  })

  const result = parseWithDecryptor.sync('HELLO=encrypted:ciphertext\n', {
    provider: sinon.stub(),
    decryptor: sinon.stub()
  })

  ct.same(result.parsed, { HELLO: 'encrypted:ciphertext' })
  ct.same(result.errors, [permissionError])
  ct.end()
})

t.test('parseWithDecryptor.sync preserves encrypted src and the permission error when Armor access is denied', ct => {
  const requiredError = serverSideDecryptionRequired()
  const permissionError = new Error('[PERMISSION_DENIED] denied')
  permissionError.code = 'PERMISSION_DENIED'
  const parseSync = sinon.stub()
  parseSync.onFirstCall().throws(requiredError)
  parseSync.onSecondCall().returns({ parsed: { HELLO: 'encrypted:ciphertext' }, errors: [] })
  const decryptor = sinon.stub().throws(permissionError)
  const parseWithDecryptor = proxyquire('../../../src/lib/helpers/parseWithDecryptor', {
    '@dotenvx/primitives': { parse: sinon.stub(), parseSync }
  })

  const result = parseWithDecryptor.sync('HELLO=encrypted:ciphertext\n', { decryptor })

  ct.same(result.parsed, { HELLO: 'encrypted:ciphertext' })
  ct.same(result.errors, [permissionError])
  ct.end()
})
