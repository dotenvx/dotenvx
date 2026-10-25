const fs = require('node:fs')
const resolveEnvarmorPath = require('../../lib/envarmor/parsing/resolveEnvarmorPath')
const { profile, policy } = require('@dotenvx/primitives')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function policyAction () {
  try {
    const source = fs.readFileSync(resolveEnvarmorPath())
    const file = profile(source, { f: this.opts().file ?? '.env' })
    process.stdout.write(JSON.stringify(policy(source, file), null, 2) + '\n')
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}
