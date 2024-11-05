const parseEnv = require('./parseEnv')

function quotes (src) {
  return Object.fromEntries(
    parseEnv(src).map(({ key, quote }) => [key, quote])
  )
}

module.exports = quotes
