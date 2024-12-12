const t = require('tap')
const keypair = require('../../../src/lib/helpers/keypair')

t.test('#keypair', ct => {
  const { publicKey, privateKey } = keypair()

  t.ok(publicKey, 'Public key should be defined')
  t.ok(privateKey, 'Private key should be defined')
  t.equal(publicKey.length, 66, 'Public key should be 66 characters long')
  t.equal(privateKey.length, 64, 'Private key should be 64 characters long')

  ct.end()
})

t.test('keypair uses provided private key to generate public key', (t) => {
  const existingPrivateKey = '4c06b1f9ffc4af11d0d206fd43f28bc96b68647158c1666edc4832f19857cef9'
  const { publicKey, privateKey } = keypair(existingPrivateKey)

  t.equal(privateKey, existingPrivateKey, 'Private key should match the provided private key')
  t.ok(publicKey, 'Public key should be defined')
  t.equal(publicKey.length, 66, 'Public key should be 66 characters long')

  // Generate the public key from the provided private key for comparison
  const { PrivateKey } = require('eciesjs')
  const kp = new PrivateKey(Buffer.from(existingPrivateKey, 'hex'))
  const expectedPublicKey = kp.publicKey.toHex()

  t.equal(publicKey, expectedPublicKey, 'Public key should match the expected public key generated from the provided private key')

  t.end()
})
