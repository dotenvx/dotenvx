const dotenvParse = require('./dotenvParse')
const escapeForRegex = require('./escapeForRegex')

function replaceExistingValue (src, key, originalValue, replaceValue) {
  const escapedKey = escapeForRegex(key)
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
    escapedKey + // KEY
    '\\s*=\\s*' + // spaces (KEY = value)
    '(["\'`]?)' + // open quote
    escapedOriginalValue + // escaped value
    '\\3' + // close quote
    enforceEndOfLine
    ,
    'gm' // (g)lobal (m)ultiline
  )

  return src.replace(currentPart, function (match, spaces = '', exportPart = '', quote = '') {
    let newPart = `${key}=${quote}${replaceValue}${quote}`

    // if empty quote and consecutive newlines
    const newlineMatch = src.match(new RegExp(`${escapedKey}\\s*=\\s*\n\n`, 'm')) // match any consecutive newline scenario for a blank value
    if (escapedOriginalValue === '' && quote === '' && newlineMatch) {
      const newlineCount = (newlineMatch[0].match(/\n/g)).length - 1
      for (let i = 0; i < newlineCount; i++) {
        newPart += '\n' // re-append the extra newline to preserve user's format choice
      }
    }

    return `${spaces}${exportPart}${newPart}`
  })
}

function replace (src, key, replaceValue) {
  let output
  let newPart = ''

  const parsed = dotenvParse(src, true, true, true) // skip expanding \n and skip converting \r\n
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    const allValues = parsed[key]
    let duplicateOutput = src
    const replacements = Array.isArray(replaceValue) ? replaceValue : allValues.map(() => replaceValue)
    const replacementByValue = new Map()

    allValues.forEach((value, index) => {
      if (!replacementByValue.has(value)) {
        replacementByValue.set(value, replacements[index])
      }
    })

    for (const [value, replacement] of replacementByValue) {
      duplicateOutput = replaceExistingValue(duplicateOutput, key, value, replacement)
    }

    return duplicateOutput
  } else {
    newPart += `${key}="${replaceValue}"`

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
