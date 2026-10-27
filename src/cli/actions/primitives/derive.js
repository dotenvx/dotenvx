const { derive: _derive } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function derive () {
  const { privateKeyHex } = this.opts()

  try {
    const publicKey = _derive(privateKeyHex)
    console.log(publicKey)
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = derive
