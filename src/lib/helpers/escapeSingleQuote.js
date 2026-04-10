function escapeSingleQuote (value) {
  // Wrap value in single quotes for shell-safe eval.
  // Any embedded single quotes are escaped using the POSIX idiom: '\''
  // (end single-quoted string, insert escaped literal quote, re-open single-quoted string)
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

module.exports = escapeSingleQuote
