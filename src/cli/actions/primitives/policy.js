const { policy: _policy } = require('@dotenvx/primitives')
const fsx = require('../../../lib/helpers/fsx')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function policy () {
  const options = this.opts()

  try {
    const source = fsx.readFileXSync('Dotenvxfile')
    const json = _policy(source, options.file)
    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = policy
