const { execSync } = require('child_process')

function _chomp (value) {
  return value.replace(/\r?\n|\r/, '')
}

function interpolate (value, processEnv, parsed) {
  const matches = value.match(/\$\([^()]+\)/) || []

  return matches.reduce(function (newValue, match) {
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

module.exports.eval = evaluate
