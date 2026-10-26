const fs = require('node:fs')
const resolveDotenvxfilePath = require('../../lib/dotenvxfile/parsing/resolveDotenvxfilePath')
const { profile } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function primitivesProfile () {
  try {
    const source = fs.readFileSync(resolveDotenvxfilePath())
    const options = this.opts()
    const file = profile(source, { f: options.file, profile: options.profile, processEnv: process.env })
    process.stdout.write(file + '\n')
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
