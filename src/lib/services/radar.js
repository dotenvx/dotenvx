const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

class Radar {
  constructor () {
    this.radarLib = null

    // check npm lib
    try {
      this.radarLib = this._radarNpm()
      logger.successv(`📡 radar: ${this.radarLib.status}`)
    } catch (e) {
      // check binary cli
      try {
        this.radarLib = this._radarCli()
        logger.successv(`📡 radar: ${this.radarLib.status}`)
      } catch (_e2) {
        // noop
      }
      // noop
    }
  }

  observe (payload) {
    if (this.radarLib && this.radarLib.status !== 'off') {
      const encoded = this.encode(payload)
      this.radarLib.observe(encoded)
    }
  }

  encode (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  _radarNpm () {
    const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-radar')
    const status = childProcess.execSync(`${fallbackBin} status`, { stdio: ['pipe', 'pipe', 'ignore'] })

    return {
      status: status.toString().trim(),
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
    const status = childProcess.execSync('dotenvx-radar status', { stdio: ['pipe', 'pipe', 'ignore'] })

    return {
      status: status.toString().trim(),
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
