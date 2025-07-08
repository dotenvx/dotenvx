const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

function logRadar () {
  let installed = false

  try {
    // if installed as sibling module
    const projectRoot = path.resolve(process.cwd())
    const dotenvxRadarPath = require.resolve('@dotenvx/dotenvx-radar', { paths: [projectRoot] })
    require(dotenvxRadarPath)
    installed = true
  } catch (_e) {
    try {
      // if installed as binary cli
      childProcess.execSync('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
      installed = true
      // if succeeds
    } catch (_e) {
      // do nothing
    }
  }

  if (installed) {
    logger.successv('radar active 📡')
  }
}

module.exports = logRadar
