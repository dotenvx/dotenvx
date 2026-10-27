const { scan, upsert } = require('@dotenvx/primitives')

const mask = require('./mask')

function maskEnvSrc (envSrc, showChar) {
  const { scanned } = scan(envSrc)

  for (const [key, values] of Object.entries(scanned)) {
    envSrc = upsert(envSrc, key, values.map(value => mask(value, showChar)))
  }

  return envSrc
}

module.exports = maskEnvSrc
