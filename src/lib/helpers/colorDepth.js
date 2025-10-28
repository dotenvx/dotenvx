const { WriteStream } = require('tty')

/**
 * Returns the color depth of the terminal.
 * Wraps {@link WriteStream.prototype.getColorDepth}.
 *
 * @returns {number} The color depth of the terminal.
 */
const getColorDepth = () => {
  try {
    return WriteStream.prototype.getColorDepth()
  } catch (error) {
    const term = process.env.TERM

    if (term && (term.includes('256color') || term.includes('xterm'))) {
      return 8 // 256 colors
    }

    return 4
  }
}

module.exports = { getColorDepth }
