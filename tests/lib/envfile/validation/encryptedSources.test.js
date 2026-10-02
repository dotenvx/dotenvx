const t = require('tap')
const { keypair, encrypt } = require('@dotenvx/primitives')
const encryptedSources = require('../../../../src/lib/envfile/validation/encryptedSources')
const parse = require('../../../../src/lib/helpers/parseWithDecryptor')

t.test('normally decrypted values retain encrypted provenance', async t => {
  const { publicKey, privateKey } = keypair()
  const src = `DOTENV_PUBLIC_KEY=${publicKey}\nSECRET=${encrypt(publicKey, 'fixture-secret')}`
  const result = await parse(src, { processEnv: { DOTENV_PRIVATE_KEY: privateKey }, provider: null })
  t.equal(result.injected.SECRET, 'fixture-secret')
  t.same([...encryptedSources([{ src, ...result }])], ['SECRET'])
})

t.test('source tracking never treats a shell value or a reference as encrypted', t => {
  const { publicKey } = keypair()
  const ciphertext = encrypt(publicKey, 'same')
  t.same([...encryptedSources([{ src: `SECRET=${ciphertext}`, injected: {}, existed: { SECRET: 'same' } }])], [])
  t.same([...encryptedSources([{ src: 'SECRET=$OTHER', injected: { SECRET: 'same' } }])], [])
  t.same([...encryptedSources([{ src: `SECRET=${ciphertext}`, injected: { SECRET: ciphertext } }])], [])
  t.end()
})
