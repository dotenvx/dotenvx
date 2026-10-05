const fs = require('node:fs')
const { createRedactor } = require('./redactOutput')

const stateKey = Symbol.for('dotenvx.redactProcessOutput')

// Keep a possible secret prefix between writes, including split UTF-8 buffers.
function install (stream, secrets) {
  if (stream[stateKey]) {
    stream[stateKey].add(secrets)
    return
  }
  const redactor = createRedactor(secrets)
  const write = stream.write.bind(stream)
  const end = stream.end.bind(stream)
  const consume = (chunk, encoding) => redactor.write(typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk)
  // Do not release an unfinished secret prefix at shutdown.
  const flush = () => redactor.flush(true)

  stream.write = function (chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }
    if (!(typeof chunk === 'string' || chunk instanceof Uint8Array) || (callback !== undefined && typeof callback !== 'function')) {
      return write(chunk, encoding, callback)
    }
    return write(consume(chunk, encoding), 'utf8', callback)
  }
  stream.end = function (chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk
      chunk = undefined
    } else if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }
    const output = chunk === undefined || chunk === null ? '' : consume(chunk, encoding)
    return end(output + flush(), 'utf8', callback)
  }
  stream[stateKey] = redactor
  process.on('beforeExit', () => {
    const output = flush()
    if (output) write(output)
  })
  process.on('exit', () => {
    const output = flush()
    if (output) {
      try { fs.writeSync(stream.fd, output) } catch { /* The destination may already be closed. */ }
    }
  })
}

module.exports = function redactProcessOutput (secrets) {
  const values = secrets.filter(value => typeof value === 'string' && value.length > 0)
  if (!values.length) return
  install(process.stdout, values)
  install(process.stderr, values)
}
