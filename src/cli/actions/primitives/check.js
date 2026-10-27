const { policy, check: _check } = require('@dotenvx/primitives')
const fsx = require('../../../lib/helpers/fsx')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function check () {
  const options = this.opts()

  try {
    const source = fsx.readFileXSync('Dotenvxfile')
    const rules = policy(source, options.file)
    const result = _check(rules, process.env)
    console.log(JSON.stringify(result, null, 2))
    return { exitCode: result.errors.some(error => error.strict) ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
