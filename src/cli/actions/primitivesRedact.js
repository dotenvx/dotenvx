const { redact } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = async function primitivesRedact (text) {
  try {
    const options = this.opts()
    if (options.stdin) {
      if (text !== undefined) throw new Error('Cannot combine a text argument with --stdin')
      process.stdin.setEncoding('utf8')
      text = ''
      for await (const chunk of process.stdin) text += chunk
    }
    if (text === undefined) throw new Error('Provide text or use --stdin')
    process.stdout.write(redact(text, options.secret))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
