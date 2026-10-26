const readDotenvxfile = require('../../../lib/dotenvxfile/parsing/readDotenvxfile')
const { profile, policy: _policy } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function policy () {
  const options = this.opts()
  const f = options.file

  try {
    const { source } = readDotenvxfile.source()
    const file = profile(source, { f })
    const json = _policy(source, file)

    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = policy
