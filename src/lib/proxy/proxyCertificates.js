const { generateKeyPair, randomBytes } = require('node:crypto')
const { promisify } = require('node:util')
const forge = require('node-forge')

// Only public certificates are persisted. Both signing keys stay in this process.
module.exports = async function proxyCertificates (hosts = ['localhost']) {
  const generate = () => promisify(generateKeyPair)('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  const [caKeys, leafKeys] = await Promise.all([generate(), generate()])
  const issuer = [{ name: 'commonName', value: 'dotenvx temporary proxy' }]
  const certificate = (keys, subject) => {
    const cert = forge.pki.createCertificate()
    cert.publicKey = forge.pki.publicKeyFromPem(keys.publicKey)
    cert.serialNumber = '01' + randomBytes(16).toString('hex')
    cert.validity.notBefore = new Date(Date.now() - 60000)
    cert.validity.notAfter = new Date(Date.now() + 24 * 60 * 60 * 1000)
    cert.setSubject(subject)
    cert.setIssuer(issuer)
    return cert
  }
  const ca = certificate(caKeys, issuer)
  ca.setExtensions([
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true }
  ])
  const signingKey = forge.pki.privateKeyFromPem(caKeys.privateKey)
  ca.sign(signingKey, forge.md.sha256.create())
  const leaf = certificate(leafKeys, [{ name: 'commonName', value: hosts[0] || 'localhost' }])
  leaf.setExtensions([
    { name: 'basicConstraints', cA: false, critical: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: ca.generateSubjectKeyIdentifier().getBytes() },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    { name: 'subjectAltName', altNames: hosts.map(value => ({ type: 2, value })) }
  ])
  leaf.sign(signingKey, forge.md.sha256.create())
  return { ca: forge.pki.certificateToPem(ca), cert: forge.pki.certificateToPem(leaf), key: leafKeys.privateKey }
}
