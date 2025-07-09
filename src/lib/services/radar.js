const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

class Radar {
  constructor () {
    this.radarLib = null

    // check npm lib
    try {
      const projectRoot = path.resolve(process.cwd())
      const radarPath = require.resolve('@dotenvx/dotenvx-radar', { paths: [projectRoot] })
      this.radarLib = require(radarPath)

      logger.successv('📡 radar active')
    } catch (e) {
      // check binary cli
      try {
        childProcess.execSync('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] })
        this.radarLib = {
          observe: (payload) => {
            const encoded = this.encode(payload)
            try {
              childProcess.execSync(
                `dotenvx-radar observe ${encoded}`,
                { stdio: 'ignore' }
              )
            } catch (e) {
              logger.debug('radar CLI observe failed')
            }
          }
        }

        logger.successv('📡 radar active')
      } catch (_e2) {
        // noop
      }
      // noop
    }
  }

  observe (payload) {
    if (this.radarLib) {
      const encoded = this.encode(payload)
      this.radarLib.observe(encoded)
    }
  }

  encode (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }
}

module.exports = Radar
