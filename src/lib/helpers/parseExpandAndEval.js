const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const dotenvEval = require('./dotenvEval')

function parseExpandAndEval (src, overload) {
  // parse
  const parsed = dotenv.parse(src)

  // eval parsed only. do NOT eval process.env ever
  const inputParsed = {
    processEnv: {},
    parsed: parsed
  }
  const evaled = dotenvEval.eval(inputParsed).parsed

  // consider moving this logic straight into dotenv-expand
  let evalParsed = {}
  if (overload) {
    evalParsed = { ...process.env, ...evaled }
  } else {
    evalParsed = { ...evaled, ...process.env }
  }
  const expandPlease = {
    processEnv: {},
    parsed: evalParsed
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
