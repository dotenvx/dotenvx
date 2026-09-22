// Command lifecycle only. Returning an outcome does not opt into event tracking.
module.exports = function commandAction (action) {
  return async function (...args) {
    const result = await action.apply(this, args)
    if (Number.isInteger(result?.exitCode)) process.exit(result.exitCode)
    return result
  }
}
