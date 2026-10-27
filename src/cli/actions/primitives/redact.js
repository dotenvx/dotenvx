const { redact: _redact } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function redact () {
  const { text, secrets } = this.opts()

  try {
    const redacted = _redact(text, secrets)
    console.log(redacted)
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = redact
