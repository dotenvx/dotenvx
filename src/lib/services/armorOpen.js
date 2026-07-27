const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')

class ArmorOpen {
  constructor (hostname, envFile = '.env') {
    this.hostname = hostname
    this.envFile = envFile
  }

  run () {
    const hostname = this.hostname
    const envFile = this.envFile

    const { publicKeyName } = keynames(envFile)
    const publicKey = readEnvKey(publicKeyName, envFile, { strict: true })
    const url = `${hostname}/go/arm_${publicKey}`

    return {
      url,
      publicKeyName,
      publicKeyValue: publicKey
    }
  }
}

module.exports = ArmorOpen
