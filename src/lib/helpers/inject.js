function inject (processEnv = {}, parsed = {}, overload = false) {
  const injected = {}
  const preExisted = {}

  // set processEnv
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (overload === true) {
        processEnv[key] = parsed[key]

        injected[key] = parsed[key] // track injected key/value
      } else {
        preExisted[key] = processEnv[key] // track preExisted key/value
      }
    } else {
      processEnv[key] = parsed[key]
      injected[key] = parsed[key] // track injected key/value
    }
  }

  return {
    injected,
    preExisted
  }
}

module.exports = inject
