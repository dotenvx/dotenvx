const fsx = require('./../fsx')
const dotenvParse = require('./../dotenvParse')

function readEnvFileKey (keyName, filepath) {
  if (fsx.existsSync(filepath)) {
    const src = fsx.readFileX(filepath)
    const parsed = dotenvParse(src)

    if (parsed[keyName] && parsed[keyName].length > 0) {
      return parsed[keyName]
    }
  }
}

module.exports = readEnvFileKey
