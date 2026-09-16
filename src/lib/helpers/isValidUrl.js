const { URL } = require('node:url')

module.exports = function isValidUrl (value) {
  try {
    return new URL(value).protocol !== ''
  } catch {
    return false
  }
}
