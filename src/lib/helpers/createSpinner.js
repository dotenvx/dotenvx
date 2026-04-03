const FRAMES = ['◇', '⬖', '◆', '⬗']
const FRAME_INTERVAL_MS = 80

async function createSpinner (options = {}) {
  const enabled = Boolean(process.stderr.isTTY && !options.quiet && !options.verbose && !options.debug)
  if (!enabled) return null

  const text = options.text || 'thinking'
  const frames = options.frames || FRAMES

  const { default: yoctoSpinner } = await import('yocto-spinner')
  return yoctoSpinner({
    text,
    spinner: {
      frames,
      interval: FRAME_INTERVAL_MS
    },
    stream: process.stderr
  }).start()
}

module.exports = createSpinner
