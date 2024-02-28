const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const { execSync } = require('child_process')

function _chomp (value) {
  return value.replace(/\r?\n|\r/, '')
}

function interpolate (value, processEnv, parsed) {
  const matches = value.match(/\$\([^()]+\)/) || []

  return matches.reduce(function (newValue, match) {
    // return original value if match not wrapped in $(..)
    if (!(match[0] === '$' && match[1] === '(' && match[match.length - 1] === ')')) {
      return newValue
    }

    // get command
    const command = match.substring(2, match.length - 1)
    // execute command
    const value = _chomp(execSync(command).toString())
    // replace with command value
    return newValue.replace(match, value)
  }, value)
}

function evaluate (options) {
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  for (const key in options.parsed) {
    let value = options.parsed[key]

    const inProcessEnv = Object.prototype.hasOwnProperty.call(processEnv, key)
    if (inProcessEnv) {
      if (processEnv[key] === options.parsed[key]) {
        // assume was set to processEnv from the .env file if the values match and therefore interpolate
        value = interpolate(value, processEnv, options.parsed)
      } else {
        // do not interpolate - assume processEnv had the intended value even if containing a $.
        value = processEnv[key]
      }
    } else {
      // not inProcessEnv so assume interpolation for this .env key
      value = interpolate(value, processEnv, options.parsed)
    }

    options.parsed[key] = value
  }

  for (const processKey in options.parsed) {
    processEnv[processKey] = options.parsed[processKey]
  }

  return options
}

function parseExpandAndEval (src, overload) {
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

  const evaluatePlease = {
    processEnv: {},
    parsed: expanded
  }
  const evaluated = evaluate(evaluatePlease).parsed

  // but then for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
  const result = {}
  for (const key in parsed) {
    result[key] = evaluated[key]
  }

  return result
}

module.exports = parseExpandAndEval
