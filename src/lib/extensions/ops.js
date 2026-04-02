const path = require('path')
const childProcess = require('child_process')
const util = require('util')
const execFile = util.promisify(childProcess.execFile)

// const { logger } = require('./../../shared/logger')

class Ops {
  constructor () {
    this.opsLib = null
    this.opsLibPromise = null

    if (this._isForcedOff()) {
      return
    }

    // begin lazy async resolution in the background
    this.opsLibPromise = this._resolveOpsLib()
  }

  async status () {
    const opsLib = await this._getOpsLib()
    if (!opsLib) {
      return 'off'
    }

    return opsLib.status()
  }

  async keypair (publicKey) {
    const opsLib = await this._getOpsLib()
    if (!opsLib) {
      return {}
    }

    return opsLib.keypair(publicKey)
  }

  observe (payload) {
    ;(async () => {
      if (this._isForcedOff()) return

      const opsLib = await this._getOpsLib()
      if (!opsLib) return

      const status = await opsLib.status()
      if (status === 'off') return

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
      opsLib.observe(encoded)
    })().catch(() => {})
  }

  //
  // private
  //
  async _opsNpm () {
    const npmBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
    return this._opsLib(npmBin)
  }

  async _opsCli () {
    return this._opsLib('dotenvx-ops')
  }

  async _opsLib (binary) {
    await execFile(binary, ['--version'])

    return {
      status: async () => {
        const { stdout } = await execFile(binary, ['status'])
        return stdout.toString().trim()
      },
      keypair: async (publicKey) => {
        const args = ['keypair']
        if (publicKey) {
          args.push(publicKey)
        }
        const { stdout } = await execFile(binary, args)
        const parsed = JSON.parse(stdout.toString().trim())
        return parsed
      },
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn(binary, ['observe', encoded], {
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

  async _resolveOpsLib () {
    if (this._isForcedOff()) {
      return null
    }

    // check npm lib first
    try {
      const lib = await this._opsNpm()
      this.opsLib = lib
      return lib
    } catch (_e) {}

    // fallback to global binary
    try {
      const lib = await this._opsCli()
      this.opsLib = lib
      return lib
    } catch (_e) {}

    this.opsLib = null
    return null
  }

  async _getOpsLib () {
    if (this._isForcedOff()) {
      return null
    }

    if (this.opsLib) {
      return this.opsLib
    }

    if (!this.opsLibPromise) {
      this.opsLibPromise = this._resolveOpsLib()
    }

    return this.opsLibPromise
  }

  _isForcedOff () {
    return process.env.DOTENVX_OPS_OFF === 'true'
  }
}

module.exports = Ops
