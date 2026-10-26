const readDotenvxfile = require('../../../lib/dotenvxfile/parsing/readDotenvxfile')
const { profile: _profile } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function profile () {
  const options = this.opts()
  const f = options.file
  const profile = options.profile

  try {
    const { source } = readDotenvxfile.source()
    const file = _profile(source, { f, profile, processEnv: process.env })

    console.log(file)
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = profile
