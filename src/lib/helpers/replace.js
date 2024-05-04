const dotenv = require('dotenv')

function replace (src, key, value) {
  let output
  let formatted = `${key}="${value}"`

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    // replace
    const regex = new RegExp(`^${key}=.*$`, 'm') // Regular expression to find the key and replace its value
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
