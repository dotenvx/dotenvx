const fsx = require('./../fsx')
const { scan } = require('@dotenvx/primitives')

function readFileKeySync (keyName, filepath) {
  if (fsx.existsSync(filepath)) {
    const src = fsx.readFileXSync(filepath)
    const { parsed } = scan(src)
    const values = parsed[keyName]

    if (values && values.length > 0) {
      const value = values[values.length - 1]
      return value || undefined
    }
  }
}

module.exports = readFileKeySync
