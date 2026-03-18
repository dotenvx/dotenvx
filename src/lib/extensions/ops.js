const path = require('path')
const childProcess = require('child_process')

const { logger } = require('./../../shared/logger')

class Ops {
  constructor () {
    this.opsLib = null

    // check npm lib
    try { this.opsLib = this._opsNpm() } catch (_e) {}

    // check binary cli
    if (!this.opsLib) {
      try { this.opsLib = this._opsCli() } catch (_e) {}
    }

    if (this.opsLib) {
      // logger.successv(`🛡️ ops: ${this.opsLib.status}`)
    }
  }

  status () {
    if (!this.opsLib) {
      return null
    }

    return this.opsLib.status()
  }

  observe (payload) {
    if (this.opsLib && this.opsLib.status() !== 'off') {
      const encoded = this.encode(payload)
      this.opsLib.observe(encoded)
    }
  }

  keypair (publicKey) {
    if (!this.opsLib) {
      return {}
    }

    return this.opsLib.keypair(publicKey)
  }

  encode (payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  _opsNpm () {
    const npmBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
    childProcess.execFileSync(npmBin, ['--version'], { stdio: ['pipe', 'pipe', 'ignore'] })

    return {
      status: () => {
        return childProcess.execFileSync(npmBin, ['status'], { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
      },
      keypair: (publicKey) => {
        const args = ['keypair']
        if (publicKey) {
          args.push(publicKey)
        }
        const output = childProcess.execFileSync(npmBin, args, { stdio: ['pipe', 'pipe', 'ignore'] }).toString()
        const parsed = JSON.parse(output.toString())
        return parsed
      },
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn(npmBin, ['observe', encoded], {
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
    childProcess.execFileSync('dotenvx-ops', ['--version'], { stdio: ['pipe', 'pipe', 'ignore'] })

    return {
      status: () => {
        return childProcess.execFileSync('dotenvx-ops', ['status'], { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
      },
      keypair: (publicKey) => {
        const args = ['keypair']
        if (publicKey) {
          args.push(publicKey)
        }
        const output = childProcess.execFileSync('dotenvx-ops', args, { stdio: ['pipe', 'pipe', 'ignore'] }).toString()
        const parsed = JSON.parse(output.toString())
        return parsed
      },
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
      }
    }
  }
}

module.exports = Ops
