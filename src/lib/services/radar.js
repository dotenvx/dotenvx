const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

class Radar {
  constructor () {
    this.radarLib = null

    // check npm lib
    try {
      this.radarLib = this._radarNpm()
      logger.successv('📡 radar active')
    } catch (e) {
      // check binary cli
      try {
        this.radarLib = this._radarCli()
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

  _radarNpm () {
    const projectRoot = path.resolve(process.cwd())
    // eslint-disable-next-line no-eval
    const npmPath = eval('require').resolve('@dotenvx/dotenvx-radar', { paths: [projectRoot] }) // necessary for webpack builds
    // eslint-disable-next-line no-eval
    return eval('require')(npmPath) // necessary for webpack builds
  }

  _radarCli () {
    childProcess.execSync('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] })
    return {
      observe: (payload) => {
        const encoded = this.encode(payload)
        try {
          childProcess.execSync(`dotenvx-radar observe ${encoded}`, { stdio: 'ignore' })
        } catch (e) {
          // noop
        }
      }
    }
  }
}

module.exports = Radar
