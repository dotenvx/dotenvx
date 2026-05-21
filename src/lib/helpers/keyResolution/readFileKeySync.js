const fsx = require('./../fsx')
const dotenvParse = require('./../dotenvParse')

function readFileKeySync (keyName, filepath) {
  if (fsx.existsSync(filepath)) {
    const src = fsx.readFileXSync(filepath)
    const parsed = dotenvParse(src)

    if (parsed[keyName] && parsed[keyName].length > 0) {
      return parsed[keyName]
    }
  }
}

module.exports = readFileKeySync
