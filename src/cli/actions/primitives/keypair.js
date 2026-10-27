const { keypair: _keypair } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function keypair () {
  const { privateKey } = this.opts()

  try {
    const json = _keypair(privateKey)
    console.log(JSON.stringify(json))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = keypair
