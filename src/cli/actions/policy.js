const fs = require('node:fs')
const resolveSuperenvPath = require('../../lib/envfile/parsing/resolveSuperenvPath')
const { profile, policy } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function policyAction () {
  try {
    const source = fs.readFileSync(resolveSuperenvPath())
    const file = profile(source, { f: this.opts().file ?? '.env' })
    process.stdout.write(JSON.stringify(policy(source, file), null, 2) + '\n')
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
