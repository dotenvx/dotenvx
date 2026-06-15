function listenForOpenKey (onOpen) {
  const stdin = process.stdin
  if (!stdin.isTTY) return () => {}

  const canSetRawMode = typeof stdin.setRawMode === 'function'
  const wasRawMode = Boolean(stdin.isRaw)
  let didHandleOpenChoice = false

  const cleanup = () => {
    stdin.off('data', onData)
    if (canSetRawMode) stdin.setRawMode(wasRawMode)
    stdin.pause()
  }

  const onData = (chunk) => {
    const key = String(chunk)
    const lower = key.toLowerCase()

    if (key === '\u0003') {
      cleanup()
      process.kill(process.pid, 'SIGINT')
      return
    }

    if (key === '\r' || key === '\n' || lower === 'y') {
      if (!didHandleOpenChoice) {
        didHandleOpenChoice = true
        Promise.resolve(onOpen()).catch(() => {})
      }
      return
    }

    if (lower === 'n') {
      cleanup()
      process.kill(process.pid, 'SIGINT')
    }
  }

  if (canSetRawMode) stdin.setRawMode(true)
  stdin.resume()
  stdin.on('data', onData)

  return cleanup
}

module.exports = listenForOpenKey
