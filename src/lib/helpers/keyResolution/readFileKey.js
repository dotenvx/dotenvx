const fsx = require('./../fsx')
const dotenvParse = require('./../dotenvParse')

async function readFileKey (keyName, filepath) {
  if (!(await fsx.exists(filepath))) {
    return undefined
  }

  const src = await fsx.readFileX(filepath)
  const parsed = dotenvParse(src)

  if (parsed[keyName] && parsed[keyName].length > 0) {
    return parsed[keyName]
  }
}

module.exports = readFileKey
