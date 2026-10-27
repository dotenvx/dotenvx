const { storagecheck: _storagecheck } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function storagecheck () {
  const { policy, values } = this.opts()

  try {
    const result = _storagecheck(JSON.parse(policy), JSON.parse(values))
    console.log(JSON.stringify(result, null, 2))
    return { exitCode: result.errors.some(error => error.strict) ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = storagecheck
