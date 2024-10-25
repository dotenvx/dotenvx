const util = require('util')
const dotenv = require('dotenv')

const quotes = require('./quotes')
const escapeForRegex = require('./escapeForRegex')
const escapeDollarSigns = require('./escapeDollarSigns')

function replace (src, key, replaceValue) {
  let output
  let escapedValue = util.inspect(replaceValue, { showHidden: false, depth: null, colors: false })

  if (replaceValue.includes('\n')) {
    escapedValue = JSON.stringify(replaceValue) // use JSON stringify if string contains newlines
    escapedValue = escapedValue.replace(/\\n/g, '\n') // fix up newlines
    escapedValue = escapedValue.replace(/\\r/g, '\r')
  }

  // prevents test\test (and similar) from becoming test\\test and then test\\\\test, etc recursively after each encrypt/decrypt combo
  if (replaceValue.includes('\\')) {
    escapedValue = escapedValue.replace(/\\\\/g, '\\')
  }

  let newPart = ''

  const parsed = dotenv.parse(src)
  const _quotes = quotes(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    const quote = _quotes[key]
    // newPart += `${key}=${quote}${escapedValue}${quote}`
    newPart += `${key}=${quote}${replaceValue}${quote}`

    const originalValue = parsed[key]
    const escapedOriginalValue = escapeForRegex(originalValue)

    // conditionally enforce end of line
    let enforceEndOfLine = ''
    if (escapedOriginalValue === '') {
      enforceEndOfLine = '$' // EMPTY scenario
    }

    const currentPart = new RegExp(
      '^' + // start of line
      '(\\s*)?' + // spaces
      '(export\\s+)?' + // export
      key + // KEY
      '\\s*=\\s*' + // spaces (KEY = value)
      '["\'`]?' + // open quote
      escapedOriginalValue + // escaped value
      '["\'`]?' + // close quote
      enforceEndOfLine
      ,
      'gm' // (g)lobal (m)ultiline
    )

    const saferInput = escapeDollarSigns(newPart) // cleanse user inputted capture groups ($1, $2 etc)

    // $1 preserves spaces
    // $2 preserves export
    output = src.replace(currentPart, `$1$2${saferInput}`)
  } else {
    newPart += `${key}=${escapedValue}`

    // append
    if (src.endsWith('\n')) {
      newPart = newPart + '\n'
    } else {
      newPart = '\n' + newPart
    }

    output = src + newPart
  }

  return output
}

module.exports = replace
