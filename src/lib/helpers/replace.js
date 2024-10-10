const dotenv = require('dotenv')

function replace (src, key, value) {
  let output
  let formatted = `${key}="${value}"` // TODO: can we somehow preserve the original quotes here? so not using double quote if that was not original?

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    // (?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)
    // (^|\n)\s*(export\s+)?JSON\s*=\s*(["'])(?:[^\\\3]|\\.)*\3

    const regex = new RegExp(
      // Match the key at the start of a line, following a newline, or prefaced by export
      `(^|\\n)\\s*(export\\s+)?${key}` +
      // Permit any amount of spaces before or after the equal sign (KEY = value)
      `\\s*=\\s*` +
      // Non-capturing group to handle different types of quotations and unquoted values
      '(?:' +
        '(["\'`])' + // Match an opening quote
        '.*?' + // Non-greedy match for any characters within quotes
        // '\\2' + // Match the corresponding closing quote
        '(?<!\\\\)' + // Ensures the closing quote is not proceeded by a backslash
        '\\3' + // Match the corresponding closing quote
      '|' +
        // Match unquoted values; account for escaped newlines
        '(?:[^#\\n\\\\]|\\\\.)*' + // Use non-capturing group for any character except #, newline, or backslash, or any escaped character
      ')',
      'gs' // Global and dotAll mode to treat string as single line
    )

    output = src.replace(regex, `$1$2${formatted}`)
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
