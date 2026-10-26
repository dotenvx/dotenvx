const { derive: _derive } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function derive (privateKey) {
  const options = this.opts()
  const stdin = options.stdin

  try {
    if (stdin) {
      process.stdin.setEncoding('utf8')
      let input = ''
      for await (const chunk of process.stdin) input += chunk
      privateKey = input.trim()
    }

    const publicKey = _derive(privateKey)
    console.log(publicKey)
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = derive
