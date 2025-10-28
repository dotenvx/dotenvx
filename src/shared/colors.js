const depth = require('../lib/helpers/colorDepth')

/**
 * Color name
 * @typedef {'blue' | 'gray' | 'green' | 'olive' | 'orangered' | 'plum' | 'red' | 'electricblue' | 'dodgerblue'} ColorName
 */

/**
 * @type {Map<ColorName, number>}
 */
const colors16 = new Map([
  ['blue', 34],
  ['gray', 37],
  ['green', 32],
  ['olive', 33],
  ['orangered', 31], // mapped to red
  ['plum', 35], // mapped to magenta
  ['red', 31],
  ['electricblue', 36],
  ['dodgerblue', 36]
])

/**
 * @type {Map<ColorName, number>}
 */
const colors256 = new Map([
  ['blue', 21],
  ['gray', 244],
  ['green', 34],
  ['olive', 142],
  ['orangered', 202],
  ['plum', 182],
  ['red', 196],
  ['electricblue', 45],
  ['dodgerblue', 33]
])

/**
 * Returns a function that wraps a message string with the specified terminal color codes
 * @param {ColorName} color
 * @returns {function(string): string}
 */
function getColor (color) {
  const colorDepth = depth.getColorDepth()
  if (!colors256.has(color)) {
    throw new Error(`Invalid color ${color}`)
  }
  if (colorDepth >= 8) {
    const code = colors256.get(color)
    return (message) => `\x1b[38;5;${code}m${message}\x1b[39m`
  }
  if (colorDepth >= 4) {
    const code = colors16.get(color)
    return (message) => `\x1b[${code}m${message}\x1b[39m`
  }
  return (message) => message
}

/**
 * Wraps a message string with the bold terminal color code
 * @param {string} message
 * @returns {string} The message with the bold terminal color code
 */
function bold (message) {
  if (depth.getColorDepth() >= 4) {
    return `\x1b[1m${message}\x1b[22m`
  }

  return message
}

module.exports = {
  getColor,
  bold
}
