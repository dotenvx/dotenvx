const { injectsummary: _injectsummary } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function injectsummary () {
  const { count, files } = this.opts()

  try {
    console.log(_injectsummary(Number(count), JSON.parse(files)))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = injectsummary
