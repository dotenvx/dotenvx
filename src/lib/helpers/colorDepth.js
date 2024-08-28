const { WriteStream } = require('tty')

const getColorDepth = () => {
  try {
    return WriteStream.prototype.getColorDepth()
  } catch (error) {
    return 4
  }
}

module.exports = { getColorDepth }
