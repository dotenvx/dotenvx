const dotenv = require('dotenv')

function replace (src, key, value) {
  let output
  let formatted = `${key}="${value}"`

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    const regex = new RegExp(
      `^${key}=` +  // start of line with key
      `(?:` + // begin non-capturing group for handling both quoted and unquoted values
        `(["'\`])` + // capture opening quote (' or " or `)
        `[^\\1]*` + // match any character except the quote captured initially
        `\\1` + // match the same closing quote as captured at the start
      `|` + // OR
        `[^#\\n]*` + // match any characters until a # (comment) or newline
      `)` + // end non-capturing group
      `(\\n[^A-Z0-9_].*)*`, // match subsequent lines that don't start with a letter, number, or underscore (continuation lines)
      'm' // apply multiline mode, so ^ and $ match start and end of lines, not just the whole string
    )

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
