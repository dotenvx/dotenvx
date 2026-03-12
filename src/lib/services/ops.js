const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

class Ops {
  constructor () {
    this.opsLib = null

    // check npm lib
    try {
      this.opsLib = this._opsNpm()
      logger.successv(`📡 radar: ${this.opsLib.status}`)
    } catch (e) {
      // check binary cli
      try {
        this.opsLib = this._opsCli()
        logger.successv(`📡 radar: ${this.opsLib.status}`)
      } catch (_e2) {
        // noop
      }
      // noop
    }
  }

  observe (payload) {
    if (this.opsLib && this.opsLib.status !== 'off') {
      const encoded = this.encode(payload)
      this.opsLib.observe(encoded)
    }
  }

  keypair (payload) {
    if (this.opsLib && this.opsLib.status !== 'off' && this.opsLib.keypair) {
      const encoded = this.encode(payload)
      this.opsLib.keypair(encoded)
    }
  }

  encode (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  _opsNpm () {
    const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
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
      },
      keypair: (encoded) => {
        try {
          const subprocess = childProcess.spawn(fallbackBin, ['keypair', encoded], {
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

  _opsCli () {
    const status = childProcess.execSync('dotenvx-ops status', { stdio: ['pipe', 'pipe', 'ignore'] })

    return {
      status: status.toString().trim(),
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn('dotenvx-ops', ['observe', encoded], {
            stdio: 'ignore',
            detached: true
          })

          subprocess.unref() // let it run independently
        } catch (e) {
          // noop
        }
      },
      keypair: (encoded) => {
        try {
          const subprocess = childProcess.spawn('dotenvx-ops', ['keypair', encoded], {
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

module.exports = Ops
