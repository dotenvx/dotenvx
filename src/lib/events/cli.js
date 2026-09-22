const createEvents = require('./index')
const catalog = require('./catalog')

module.exports = function trackCli (command, action) {
  return async function (...args) {
    const options = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : this.opts()
    const context = this
    const previous = Object.getOwnPropertyDescriptor(context, 'events')
    const name = `cli/${command}`
    const eventOptions = {}
    for (const [key, value] of Object.entries(options)) {
      const source = typeof this.getOptionValueSourceWithGlobals === 'function'
        ? this.getOptionValueSourceWithGlobals(key)
        : this.getOptionValueSource?.(key)
      if (source === 'cli' || source === 'env') eventOptions[key] = value
    }
    const events = createEvents(name, options, { eventOptions, background: true })
    Object.defineProperty(context, 'events', { configurable: true, value: events })
    if (catalog[name]?.keyArgument) events.add({ key: args[0] })
    let code
    let result
    try {
      result = await action.apply(context, args)
      if (Number.isInteger(result?.exitCode)) code = result.exitCode
      if (result?.error) {
        events.fail(result.error)
        code = code ?? 1
      }
      if (result?.signal) events.add({ signal: result.signal })
      return result
    } catch (error) {
      code = 1
      events.fail(error)
      throw error
    } finally {
      try {
        const exitCode = code ?? process.exitCode ?? 0
        await events.complete(exitCode === 0 ? 'success' : 'unsuccessful', { exit_code: exitCode })
      } finally {
        if (previous) Object.defineProperty(context, 'events', previous)
        else delete context.events
      }
      if (Number.isInteger(result?.exitCode)) process.exit(result.exitCode)
    }
  }
}
