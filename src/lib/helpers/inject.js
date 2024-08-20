function inject (clonedProcessEnv = {}, parsed = {}, overload = false, processEnv = process.env) {
  const injected = {}
  const preExisted = {}

  // set processEnv
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(clonedProcessEnv, key)) {
      if (overload === true) {
        processEnv[key] = parsed[key]
        injected[key] = parsed[key] // track injected key/value
      } else {
        processEnv[key] = clonedProcessEnv[key]
        preExisted[key] = clonedProcessEnv[key] // track preExisted key/value
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
