// @ts-check
const dotenvx = require('../main')

const nextEnv = require('@next/env')
const originalLoadEnvConfig = nextEnv.loadEnvConfig

function loadEnvConfig (...args) {
  dotenvx.config({ quiet: true })
  return originalLoadEnvConfig.apply(nextEnv, args)
}

module.exports = {
  ...nextEnv,
  loadEnvConfig
}
