// Command lifecycle only. Returning an outcome does not opt into event tracking.
module.exports = function commandAction (action) {
  return async function (...args) {
    const result = await action.apply(this, args)
    if (Number.isInteger(result?.exitCode)) {
      // Pipe writes are asynchronous. Flush both streams before forcing exit so
      // successful output and failure diagnostics cannot be silently truncated.
      await Promise.all([process.stdout, process.stderr].map(stream => {
        if (!stream.writable || stream.destroyed) return Promise.resolve()
        return new Promise(resolve => stream.write('', 'utf8', resolve))
      }))
      process.exit(result.exitCode)
    }
    return result
  }
}
