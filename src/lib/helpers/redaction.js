const { formatWithOptions } = require('node:util')
const { createRedactor } = require('./redactOutput')
const { redact } = require('@dotenvx/primitives')

// Next may load independent copies of this module in the same process.
const stateKey = Symbol.for('@dotenvx/dotenvx/redaction')
function state () {
  if (!globalThis[stateKey]) globalThis[stateKey] = { values: new Set(), streams: [], consoles: new Map() }
  return globalThis[stateKey]
}

function install (values = []) {
  const shared = state()
  // Keep old values protected during hot reload while old code can still log them.
  for (const value of values) if (value !== undefined && value !== null && `${value}`) shared.values.add(`${value}`)
  if (!shared.values.size) return

  for (const stream of [process.stdout, process.stderr]) {
    let entry = shared.streams.find(item => item.stream === stream)
    if (!entry) {
      const original = stream.write
      const redactor = createRedactor([...shared.values])
      const write = function (chunk, encoding, callback) {
        if (typeof encoding === 'function') { callback = encoding; encoding = undefined }
        const output = redactor.write(typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk)
        if (output) return original.call(this, output, 'utf8', callback)
        if (callback) process.nextTick(callback)
        return true
      }
      entry = { stream, original, redactor, write }
      shared.streams.push(entry)
      stream.write = write
    } else entry.redactor.add([...shared.values])
  }

  // Redact before React or another console wrapper captures arguments for replay.
  for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir']) {
    const previous = shared.consoles.get(method)
    if (previous === console[method]) continue
    const original = console[method]
    const wrapped = function (...args) {
      const message = method === 'dir'
        ? require('node:util').inspect(args[0], args[1])
        : formatWithOptions({}, ...args)
      return original.call(this, redact(message, [...shared.values]))
    }
    shared.consoles.set(method, wrapped)
    console[method] = wrapped
  }
  if (!shared.flushInstalled) {
    shared.flushInstalled = true
    const flush = () => {
      for (const { stream, original, redactor } of shared.streams) {
        // A trailing prefix may be the beginning of a secret. Never reveal it.
        const pending = redactor.flush(true)
        if (pending) original.call(stream, pending)
      }
    }
    process.on('beforeExit', flush)
    process.on('exit', flush)
  }
}

function policyValues (policy, env, loadedKeys = []) {
  const loaded = new Set(loadedKeys)
  const values = Object.entries(env).filter(([key]) => {
    if (/^DOTENV_PUBLIC_KEY(?:_|$)/.test(key)) return false
    if (!loaded.has(key) && !Object.hasOwn(policy.keys, key)) return false
    const rule = policy.keys[key] || policy.keys['*']
    return rule && rule.stdout && rule.stdout.redacted === true
  }).map(([, value]) => value)
  return values
}

module.exports = { policyValues, applyRedaction: install }
