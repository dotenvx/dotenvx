const readDotenvxfile = require('../../../lib/dotenvxfile/parsing/readDotenvxfile')
const { profile: _profile, policy, check: _check } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function check () {
  const options = this.opts()
  const f = options.file
  const profile = options.profile

  try {
    const { source } = readDotenvxfile.source()
    const file = _profile(source, { f, profile })
    const rules = policy(source, file)
    const result = _check(rules, process.env)

    console.log(JSON.stringify(result, null, 2))
    return { exitCode: result.errors.length ? 1 : 0 }
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
