const dotenv = require('dotenv')

function replace (src, key, value) {
  let output
  let formatted = `${key}="${value}"`

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    // replace
    const regex = new RegExp(`^${key}=(?:"[^"]*"|[^\\n]*)(\\n[^A-Z0-9_].*)*`, 'm')
    output = src.replace(regex, formatted)
  } else {
    // append
    if (src.endsWith('\n')) {
      formatted = formatted + '\n'
    } else {
      formatted = '\n' + formatted
    }

    output = src + formatted
  }

  return output
}

module.exports = replace
