const commandAction = require('../../cli/commandAction')
const createEvents = require('./index')
const catalog = require('./catalog')

module.exports = function trackCli (command, action) {
  return commandAction(async function (...args) {
    const options = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : this.opts()
    const context = this
    const name = `cli/${command}`
    const eventOptions = {}
    for (const [key, value] of Object.entries(options)) {
      const source = typeof this.getOptionValueSourceWithGlobals === 'function'
        ? this.getOptionValueSourceWithGlobals(key)
        : this.getOptionValueSource?.(key)
      if (source === 'cli' || source === 'env') eventOptions[key] = value
    }
    const events = createEvents(name, options, { eventOptions, background: true })
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
      if (Number.isInteger(result?.errorCount)) events.add({ error_count: result.errorCount })
      if (result?.signal) events.add({ signal: result.signal })
      return result
    } catch (error) {
      code = 1
      events.fail(error)
      throw error
    } finally {
      const exitCode = code ?? process.exitCode ?? 0
      await events.complete(exitCode === 0 && !(result?.errorCount > 0) ? 'success' : 'unsuccessful', { exit_code: exitCode })
    }
  })
}
