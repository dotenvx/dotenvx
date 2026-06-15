const Conf = require('conf')
const { PrivateKey } = require('eciesjs')

const encryptValue = require('./../lib/helpers/encryptValue')
const decryptValue = require('./../lib/helpers/decryptValue')

class Device {
  constructor () {
    this.store = new Conf({
      cwd: process.env.DOTENVX_CONFIG || undefined,
      projectName: 'dotenvx',
      configName: '.device-key',
      projectSuffix: '',
      fileExtension: '',
      encryptionKey: 'dotenvxpro dotenvxpro dotenvxpro' // backwards compatible
    })
  }

  touch () {
    const _privateKey = this.privateKey()
    const _publicKey = this.publicKey()

    return {
      privateKey: _privateKey,
      publicKey: _publicKey
    }
  }

  configPath () {
    return this.store.path
  }

  privateKey () {
    const currentPrivateKey = this.store.get('private_key/1')
    if (currentPrivateKey && currentPrivateKey.length > 0) {
      this.store.set('private_key/1', currentPrivateKey)

      return currentPrivateKey
    }

    // generate privateKey for the first time
    const kp = new PrivateKey()
    const _privateKey = kp.secret.toString('hex')

    this.store.set('private_key/1', _privateKey)

    return _privateKey
  }

  publicKey () {
    // must have private key to try and get public key
    const privateKeyHex = this.privateKey()
    if (!privateKeyHex || privateKeyHex.length < 1) {
      return ''
    }

    // create keyPair object from hex string
    const _privateKey = new PrivateKey(Buffer.from(privateKeyHex, 'hex'))

    // compute publicKey from privateKey
    return _privateKey.publicKey.toHex()
  }

  encrypt (value) {
    return encryptValue(value, this.publicKey())
  }

  decrypt (value) {
    return decryptValue(value, this.privateKey())
  }
}

module.exports = Device
