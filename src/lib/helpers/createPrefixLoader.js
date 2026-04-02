const ENCRYPTING_FRAMES = ['◇', '⬖', '◆', '⬗']
const ENCRYPTING_FRAME_INTERVAL_MS = 80

function createPrefixLoader (text = 'thinking', options = {}) {
  const enabled = Boolean(process.stderr.isTTY && !options.quiet && !options.verbose && !options.debug)

  const frames = options.frames || ENCRYPTING_FRAMES
  const intervalMs = options.intervalMs || ENCRYPTING_FRAME_INTERVAL_MS
  const stream = options.stream || process.stderr

  let frameIndex = 0
  let visible = false
  let timer = null

  const draw = () => {
    if (!enabled) return

    const frame = frames[frameIndex]
    frameIndex = (frameIndex + 1) % frames.length
    stream.write(`\r${frame} ${text}`)
    visible = true
  }

  return {
    start: () => {
      if (!enabled || timer) return
      draw()
      timer = setInterval(draw, intervalMs)
      if (typeof timer.unref === 'function') {
        timer.unref()
      }
    },
    stop: () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      if (!enabled || !visible) return
      stream.write('\r\x1b[2K')
      visible = false
    }
  }
}

module.exports = createPrefixLoader
