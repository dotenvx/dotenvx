const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const dotenvEval = require('./dotenvEval')

function parseExpandAndEval (src) {
  // parse
  const parsed = dotenv.parse(src)

  // eval parsed only. do NOT eval process.env ever. too risky/dangerous.
  const inputParsed = {
    processEnv: {},
    parsed
  }
  const evaled = dotenvEval.eval(inputParsed).parsed

  const expandPlease = {
    processEnv: {},
    parsed: { ...process.env, ...evaled } // always treat as overload, then later in the code the inject method takes care of actually setting on process.env via overload or not. this functions job is just to determine what the value would be
  }
  const expanded = dotenvExpand.expand(expandPlease).parsed

  // but then for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
  const result = {}
  for (const key in parsed) {
    result[key] = expanded[key]
  }

  return result
}

module.exports = parseExpandAndEval
