const { redact: _redact } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function redact (text) {
  const options = this.opts()
  const stdin = options.stdin
  const secret = options.secret

  try {
    if (stdin) {
      process.stdin.setEncoding('utf8')
      text = ''
      for await (const chunk of process.stdin) text += chunk
    }

    const redacted = _redact(text, secret)
    console.log(redacted)
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = redact
