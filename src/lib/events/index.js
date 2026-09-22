const { performance } = require('perf_hooks')
const safe = require('./metadata')
const catalog = require('./catalog')
const createDelivery = require('./delivery')
const createBackground = require('./background')
const armor = require('./backends/armor')
const { version } = require('../helpers/packageJson')

module.exports = function createEvents (name, options = {}, config = {}) {
  let backend
  let delivery
  let selectedOptions
  try {
    selectedOptions = safe.options(config.eventOptions || options)
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      if (config.background && !Object.prototype.hasOwnProperty.call(config, 'backend')) delivery = createBackground(options)
      else backend = Object.prototype.hasOwnProperty.call(config, 'backend') ? config.backend : armor(options)
    }
  } catch {} // Missing credentials, keychain failures, and setup are optional.

  delivery = delivery || createDelivery(backend, config.timeoutMs)
  const started = performance.now()
  const runtime = name.startsWith('sdk/') ? { sdk_version: version, sdk_language: 'javascript' } : { cli_version: version }
  let completion
  let failed = false
  let details = {}

  function record (metadata = {}, outcome = 'success', terminal = false) {
    try {
      if (completion) return
      const eventOptions = safe.options(selectedOptions)
      delivery.write({
        name,
        occurred_at: new Date().toISOString(),
        outcome: outcome === 'success' ? 'success' : 'unsuccessful',
        metadata: { ...safe.metadata(metadata), ...(Object.keys(eventOptions).length ? { options: eventOptions } : {}), ...runtime }
      }, terminal)
    } catch {}
  }

  return {
    record,
    file (row, metadata = {}) {
      try {
        if (row.error) failed = true
        record({
          ...metadata,
          phase: 'file',
          file: row.envFilepath,
          changed: !row.error && !!row.changed,
          ...(row.error ? { error_code: safe.errorCode(row.error) } : {})
        }, row.error ? 'unsuccessful' : 'success')
      } catch {}
    },
    add (metadata) { try { details = { ...details, ...safe.metadata(metadata) } } catch {} },
    fail (error) {
      failed = true
      try { details.error_code = safe.errorCode(error) } catch {}
    },
    complete (outcome, metadata = {}) {
      if (!completion) {
        record({ ...details, ...metadata, phase: 'complete', duration_ms: Math.round(performance.now() - started) }, outcome || (failed ? 'unsuccessful' : 'success'), true)
        completion = delivery.close()
      }
      return completion
    },
    flush: delivery.flush
  }
}
