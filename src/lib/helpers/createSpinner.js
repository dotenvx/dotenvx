const ENCRYPTING_FRAMES = ['◇', '⬖', '◆', '⬗']
const ENCRYPTING_FRAME_INTERVAL_MS = 80

async function createSpinner (options = {}) {
  const enabled = Boolean(process.stderr.isTTY && !options.quiet && !options.verbose && !options.debug)
  if (!enabled) return null

  const { default: yoctoSpinner } = await import('yocto-spinner')
  return yoctoSpinner({
    text: 'encrypting',
    spinner: {
      frames: ENCRYPTING_FRAMES,
      interval: ENCRYPTING_FRAME_INTERVAL_MS
    },
    stream: process.stderr
  }).start()
}

module.exports = createSpinner
