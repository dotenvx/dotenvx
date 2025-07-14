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
    const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-radar')
    childProcess.execSync(`${fallbackBin} help`, { stdio: ['pipe', 'pipe', 'ignore'] })
    return {
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn(fallbackBin, ['observe', encoded], {
            stdio: 'ignore',
            detached: true
          })

          subprocess.unref() // let it run independently
        } catch (e) {
          // noop
        }
      }
    }
  }

  _radarCli () {
    childProcess.execSync('dotenvx-radar help', { stdio: ['pipe', 'pipe', 'ignore'] })
    return {
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn('dotenvx-radar', ['observe', encoded], {
            stdio: 'ignore',
            detached: true
          })

          subprocess.unref() // let it run independently
        } catch (e) {
          // noop
        }
      }
    }
  }
}

module.exports = Radar
