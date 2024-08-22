const dotenv = require('dotenv')
const dotenvEval = require('./dotenvEval')
const dotenvExpand = require('./dotenvExpand')
const decryptValue = require('./decryptValue')
const truncate = require('./truncate')

function warning (e, key, privateKey = null) {
  const warning = new Error(`[${e.code}] could not decrypt ${key} using private key '${truncate(privateKey)}'`)
  warning.code = e.code
  warning.help = `[${e.code}] ? ${e.message}`

  return warning
}

function parseDecryptEvalExpand (src, privateKey = null, processEnv = process.env) {
  const warnings = []

  // parse
  const parsed = dotenv.parse(src)
  for (const key in parsed) {
    try {
      const decryptedValue = decryptValue(parsed[key], privateKey)
      parsed[key] = decryptedValue
    } catch (_e) {
      // do nothing. warnings tracked further below.
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
  for (const key in expanded.parsed) {
    try {
      const decryptedValue = decryptValue(expanded.parsed[key], privateKey)
      expanded.parsed[key] = decryptedValue
    } catch (e) {
      warnings.push(warning(e, key, privateKey))
    }
  }
  for (const key in processEnv) {
    try {
      const decryptedValue = decryptValue(processEnv[key], privateKey)
      processEnv[key] = decryptedValue
    } catch (e) {
      warnings.push(warning(e, key, privateKey))
    }
  }

  // for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
  const result = {}
  for (const key in parsed) {
    result[key] = expanded.parsed[key]
  }

  return { parsed: result, processEnv, warnings }
}

module.exports = parseDecryptEvalExpand
