const fs = require('node:fs')
const resolveEnvarmorPath = require('../../lib/envfile/parsing/resolveEnvarmorPath')
const { profile } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function primitivesProfile () {
  try {
    const source = fs.readFileSync(resolveEnvarmorPath())
    const options = this.opts()
    const file = profile(source, { f: options.file, profile: options.profile, processEnv: process.env })
    process.stdout.write(file + '\n')
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
