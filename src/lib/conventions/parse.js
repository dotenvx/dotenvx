// DIFFERENT
const { createSyncFn } = require('synckit')
const runProvider = createSyncFn(require.resolve('./../providers/worker'))

function provider (publicKeyHex) {
  return runProvider(require.resolve('./../providers/armor/index'), publicKeyHex)
}

const { parseSync: parseprim } = require('@dotenvx/primitives')

function parse (src, options = {}) {
  if (!Object.prototype.hasOwnProperty.call(options, 'provider')) {
    options.provider = provider
  }
  return parseprim(src, options)
}

module.exports = parse
