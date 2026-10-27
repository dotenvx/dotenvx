const { policy: _policy } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function policy () {
  const { source, file } = this.opts()

  try {
    const json = _policy(source, file)
    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = policy
