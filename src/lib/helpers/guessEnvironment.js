const path = require('path')

function guessEnvironment (filepath) {
  const filename = path.basename(filepath)
  const parts = filename.split('.')
  const possibleEnvironmentList = [...parts.slice(2)]

  if (possibleEnvironmentList.length === 0) {
    return 'development'
  }
  
  if (possibleEnvironmentList.length === 1) {
    return possibleEnvironmentList[0]
  }

  if (
    possibleEnvironmentList.length === 2 &&
    possibleEnvironmentList[possibleEnvironmentList.length - 1] === "local"
  ) {
    return possibleEnvironmentList.join("_")
  }

  return possibleEnvironmentList[0]
}

module.exports = guessEnvironment
