const { check: _check } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function check () {
  const { policy, env } = this.opts()

  try {
    const result = _check(JSON.parse(policy), JSON.parse(env))
    console.log(JSON.stringify(result, null, 2))
    return { exitCode: result.errors.some(error => error.strict) ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
