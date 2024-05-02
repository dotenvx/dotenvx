const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const dotenvEval = require('./dotenvEval')

const { decrypt } = require('eciesjs')

function parseExpandAndEval (src) {
  // parse
  const parsed = dotenv.parse(src)

  for (const key in parsed) {
    const value = parsed[key]

    // handle inline encrypted values
    if (process.env.DOTENV_PRIVATE_KEY && value.startsWith('encrypted:')) {
      // privateKey
      const DOTENV_PRIVATE_KEY = process.env.DOTENV_PRIVATE_KEY
      const privateKey = Buffer.from(DOTENV_PRIVATE_KEY, 'hex')

      // values
      const prefix = 'encrypted:'
      const subtext = value.substring(prefix.length)
      const ciphertext = Buffer.from(subtext, 'base64')

      // decrypt and insert
      const decryptedValue = decrypt(privateKey, ciphertext).toString()
      parsed[key] = decryptedValue
    }
  }

  // iterate over parsed and check for any encrypted

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
