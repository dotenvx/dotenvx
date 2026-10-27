const { storagepolicy: _storagepolicy } = require('@dotenvx/primitives')
const catchAndLog = require('../../../lib/helpers/catchAndLog')

async function storagepolicy () {
  const { source, file } = this.opts()

  try {
    const json = _storagepolicy(source, file)
    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = storagepolicy
