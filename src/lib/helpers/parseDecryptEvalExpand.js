const dotenv = require('dotenv')
const dotenvEval = require('./dotenvEval')
const dotenvExpand = require('./dotenvExpand')
const decryptValue = require('./decryptValue')

function parseDecryptEvalExpand (src, privateKey = null, processEnv = process.env) {
  // parse
  const parsed = dotenv.parse(src)

  // handle inline encrypted values
  if (privateKey && privateKey.length > 0) {
    for (const key in parsed) {
      const value = parsed[key]
      parsed[key] = decryptValue(value, privateKey)
    }
  }

  // eval parsed only. do NOT eval process.env ever. too risky/dangerous.
  const inputParsed = {
    processEnv: {},
    parsed
  }
  const evaled = dotenvEval.eval(inputParsed).parsed

  // expanded
  const inputEvaled = {
    processEnv,
    parsed: evaled
  }
  const expanded = dotenvExpand.expand(inputEvaled)

  // for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
  const result = {}
  for (const key in parsed) {
    result[key] = expanded.parsed[key]
  }

  return { parsed: result, processEnv }
}

module.exports = parseDecryptEvalExpand
