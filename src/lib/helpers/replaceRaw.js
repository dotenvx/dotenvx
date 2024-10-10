const util = require('util')
const dotenv = require('dotenv')

function replaceRaw (src, key, replaceValue) {
  let output
  let formatted = `${key}="${replaceValue}"` // TODO: can we somehow preserve the original quotes here? so not using double quote if that was not original?

  const parsed = dotenv.parse(src)
  if (Object.prototype.hasOwnProperty.call(parsed, key)) {
    const originalValue = parsed[key]

    const currentPart = new RegExp(
      `^` + // start of line
      `(\\s*)?` + // spaces
      `(export\\s+)?` + // export
      key + // KEY
      `\\s*=\\s*` + // spaces (KEY = value)
      '["\'`]?' + // open quote
      originalValue + // value
      '["\'`]?' // close quote
      ,
      'gm' // (g)lobal (m)ultiline
    )

    const escapedValue = util.inspect(replaceValue, { showHidden: false, depth: null, colors: false })
    // const escapedValue = JSON.stringify(replaceValue)
    const newPart = `${key}=${escapedValue}`

    // $1 preserves spaces
    // $2 preserves export
    output = src.replace(currentPart, `$1$2${newPart}`)
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

module.exports = replaceRaw
