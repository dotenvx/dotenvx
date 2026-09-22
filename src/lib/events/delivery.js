const BATCH_SIZE = 50
const QUEUE_LIMIT = 256

// Transport only. Backend failures cannot escape this boundary.
module.exports = function createDelivery (backend, timeoutMs = 500) {
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, 500) : 500
  const queue = []
  let running
  let controller
  let closing
  let sendBatch
  try {
    if (backend && typeof backend.send === 'function') sendBatch = backend.send.bind(backend)
  } catch {} // Treat an invalid backend as disabled, including throwing getters.
  let closed = !sendBatch

  function stop () {
    closed = true
    queue.length = 0
    if (controller) controller.abort()
  }

  async function send (batch) {
    let timer
    controller = new AbortController()
    try {
      await Promise.race([
        Promise.resolve().then(() => sendBatch(batch, { signal: controller.signal })),
        new Promise(resolve => { timer = setTimeout(() => { stop(); resolve() }, timeout) })
      ])
    } catch {
      stop()
    } finally {
      clearTimeout(timer)
    }
  }

  function pump () {
    if (closed || running || !queue.length) return
    running = (async () => {
      while (queue.length) {
        if (closed) break
        await send(queue.splice(0, BATCH_SIZE))
      }
    })().finally(() => {
      running = undefined
      pump()
    })
  }

  async function flush () {
    let timer
    try {
      // Overall flush deadline is separate from each batch's deadline.
      await Promise.race([
        (async () => {
          pump()
          let current = running
          while (current) {
            await current
            current = running
          }
        })(),
        new Promise(resolve => { timer = setTimeout(() => { stop(); resolve() }, timeout) })
      ])
    } catch {
      stop()
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    write (event, terminal = false) {
      if (closed || closing) return
      if (queue.length >= QUEUE_LIMIT) {
        if (!terminal) return
        queue.pop() // Reserve room for the final result.
      }
      queue.push(event)
      pump()
    },
    flush,
    close () {
      if (!closing) closing = flush().finally(stop)
      return closing
    }
  }
}
