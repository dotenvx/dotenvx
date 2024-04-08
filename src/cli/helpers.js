const path = require('path')

const sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// resolve path based on current running process location
const resolvePath = function (filepath) {
  return path.resolve(process.cwd(), filepath)
}

const pluralize = function (word, count) {
  // simple pluralization: add 's' at the end
  if (count === 0 || count > 1) {
    return word + 's'
  } else {
    return word
  }
}

module.exports = {
  sleep,
  resolvePath,
  pluralize
}
