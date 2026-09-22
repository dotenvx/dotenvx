const createEvents = require('./index')

// An explicit, scoped SDK facade. Sync methods stay sync; applications can flush
// completed calls before shutdown without global hooks or process.exit changes.
module.exports = function withEvents (sdk, config = {}) {
  const pending = new Set()

  function complete (events) {
    const completion = events.complete().catch(() => {})
    pending.add(completion)
    completion.finally(() => pending.delete(completion))
  }

  function invoke (name, options, metadata, action) {
    const events = createEvents(`sdk/${name}`, options, config)
    events.add(metadata)
    try {
      const result = action(events)
      if (result && typeof result.then === 'function') {
        return result.then(value => {
          complete(events)
          return value
        }, error => {
          events.fail(error)
          complete(events)
          throw error
        })
      }
      complete(events)
      return result
    } catch (error) {
      events.fail(error)
      complete(events)
      throw error
    }
  }

  return {
    config: (options = {}) => invoke('config', options, {}, events => sdk.config(options, events)),
    get: (key, options = {}) => invoke('get', options, { key }, events => sdk.get(key, options, events)),
    set: (key, value, options = {}) => invoke('set', options, { key }, events => sdk.set(key, value, options, events)),
    async flushEvents () { await Promise.all([...pending]) }
  }
}
