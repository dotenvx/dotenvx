const { injectsummary: _injectsummary } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function injectsummary () {
  const { count, files } = this.opts()

  try {
    if (!/^\d+$/.test(count) || !Number.isSafeInteger(Number(count))) throw new Error('Count must be a non-negative integer')
    const rows = JSON.parse(files)
    if (!Array.isArray(rows)) throw new Error('Files must be a JSON array')
    console.log(_injectsummary(Number(count), rows))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = injectsummary
