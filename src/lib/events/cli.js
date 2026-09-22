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
    events.finish = (code = 0) => events.complete(code === 0 ? 'success' : 'unsuccessful', { exit_code: code })
    events.exit = async (code, error) => {
      if (error) events.fail(error)
      await events.finish(code)
      process.exit(code)
    }
    Object.defineProperty(context, 'events', { configurable: true, value: events })
    if (catalog[name]?.keyArgument) events.add({ key: args[0] })
    let code = 0
    try {
      return await action.apply(context, args)
    } catch (error) {
      code = 1
      events.fail(error)
      throw error
    } finally {
      try {
        await events.finish(code || process.exitCode || 0)
      } finally {
        if (previous) Object.defineProperty(context, 'events', previous)
        else delete context.events
      }
    }
  }
}
