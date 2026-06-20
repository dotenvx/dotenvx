const Conf = require('conf')
const { derive, keypair } = require('@dotenvx/primitives')

const encryptDeviceValue = require('./../lib/helpers/encryptDeviceValue')
const decryptDeviceValue = require('./../lib/helpers/decryptDeviceValue')

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

    const _privateKey = keypair().privateKey

    this.store.set('private_key/1', _privateKey)

    return _privateKey
  }

  publicKey () {
    // must have private key to try and get public key
    const privateKeyHex = this.privateKey()
    if (!privateKeyHex || privateKeyHex.length < 1) {
      return ''
    }

    return derive(privateKeyHex)
  }

  encrypt (value) {
    return encryptDeviceValue(value, this.publicKey())
  }

  decrypt (value) {
    return decryptDeviceValue(value, this.privateKey())
  }
}

module.exports = Device
