const armor = require('./backends/armor')

// Internal, short-lived worker. No output, local logs, or retries.
module.exports = function deliverEvents () {
  let input = ''
  const stop = () => process.exit(0)
  const timer = setTimeout(stop, 5000)
  process.stdin.setEncoding('utf8')
  process.stdin.on('error', stop)
  process.stdin.on('data', chunk => {
    input += chunk
    if (Buffer.byteLength(input) > 1024 * 1024) stop()
  })
  process.stdin.on('end', async () => {
    try {
      const { options, events } = JSON.parse(input)
      if (!Array.isArray(events) || events.length > 256) return
      const backend = armor(options)
      if (backend) {
        for (let offset = 0; offset < events.length; offset += 50) {
          await backend.send(events.slice(offset, offset + 50), { signal: AbortSignal.timeout(500) })
        }
      }
    } catch {} finally {
      clearTimeout(timer)
      stop()
    }
  })
}
