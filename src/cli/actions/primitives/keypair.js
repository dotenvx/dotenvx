const { keypair: _keypair } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function keypair (privateKey) {
  const options = this.opts()
  const stdin = options.stdin

  try {
    if (stdin) {
      process.stdin.setEncoding('utf8')
      let input = ''
      for await (const chunk of process.stdin) input += chunk
      privateKey = input.trim()
    }

    const json = _keypair(privateKey)
    console.log(JSON.stringify(json))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = keypair
