const { WriteStream } = require('tty')
const getColorDepth = () => WriteStream.prototype.getColorDepth()

module.exports = { getColorDepth }
