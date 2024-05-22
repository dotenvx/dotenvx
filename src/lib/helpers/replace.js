const dotenv = require('dotenv')

function replace (src, key, value) {
  let output
  let formatted = `${key}="${value}"`

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    const regex = new RegExp(
      // Match the key at the start of a line or following a newline
      `(^|\\n)${key}\\s*=\\s*` +
      // Non-capturing group to handle different types of quotations and unquoted values
      '(?:' +
        '(["\'`])' + // Match an opening quote
        '.*?' + // Non-greedy match for any characters within quotes
        '\\2' + // Match the corresponding closing quote
      '|' +
        // Match unquoted values; account for escaped newlines
        '(?:[^#\\n\\\\]|\\\\.)*' + // Use non-capturing group for any character except #, newline, or backslash, or any escaped character
      ')',
      'gs' // Global and dotAll mode to treat string as single line
    )

    output = src.replace(regex, `$1${formatted}`)
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
