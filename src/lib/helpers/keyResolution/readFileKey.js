const fsx = require('./../fsx')
const { scan } = require('@dotenvx/primitives')

async function readFileKey (keyName, filepath) {
  if (!(await fsx.exists(filepath))) {
    return undefined
  }

  const src = await fsx.readFileX(filepath)
  const { parsed } = scan(src)
  const values = parsed[keyName]

  if (values && values.length > 0) {
    return values[values.length - 1]
  }
}

module.exports = readFileKey
