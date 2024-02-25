const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

function parseExpand (src, overload) {
  const parsed = dotenv.parse(src)

  // consider moving this logic straight into dotenv-expand
  let inputParsed = {}
  if (overload) {
    inputParsed = { ...process.env, ...parsed }
  } else {
    inputParsed = { ...parsed, ...process.env }
  }

  const expandPlease = {
    processEnv: {},
    parsed: inputParsed
  }
  const expanded = dotenvExpand.expand(expandPlease).parsed

  // but then for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
  const result = {}
  for (const key in parsed) {
    result[key] = expanded[key]
  }

  return result
}

module.exports = parseExpand
