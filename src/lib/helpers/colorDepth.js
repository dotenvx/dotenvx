const { WriteStream } = require('tty')
const getColorDepth = () => WriteStream.prototype.getColorDepth() ?? 2

module.exports = { getColorDepth }
