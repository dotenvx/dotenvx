const path = require('path')
const childProcess = require('child_process')

class Ops {
  status () {
    if (this._isForcedOff()) {
      return 'off'
    }

    const opsLib = this._opsLib()
    if (!opsLib) {
      return 'off'
    }

    return opsLib.status()
  }

  keypair (publicKey) {
    if (this._isForcedOff()) {
      return {}
    }

    const opsLib = this._opsLib()
    if (!opsLib) {
      return {}
    }

    return opsLib.keypair(publicKey)
  }

  observe (payload) {
    if (this._isForcedOff()) return

    const opsLib = this._opsLib()
    if (!opsLib) return

    const status = opsLib.status()
    if (status === 'off') return

    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    opsLib.observe(encoded)
  }

  //
  // private
  //
  _opsNpm () {
    const npmBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
    return this._opsLibForBinary(npmBin)
  }

  _opsCli () {
    return this._opsLibForBinary('dotenvx-ops')
  }

  _opsLibForBinary (binary) {
    childProcess.execFileSync(binary, ['--version'])

    return {
      status: () => {
        const stdout = childProcess.execFileSync(binary, ['status'])
        return stdout.toString().trim()
      },
      keypair: (publicKey) => {
        const args = ['keypair']
        if (publicKey) {
          args.push(publicKey)
        }
        const stdout = childProcess.execFileSync(binary, args)
        const parsed = JSON.parse(stdout.toString().trim())
        return parsed
      },
      observe: (encoded) => {
        try {
          const subprocess = childProcess.spawn(binary, ['observe', encoded], {
            stdio: 'ignore',
            detached: true
          })
          subprocess.unref()
        } catch (_e) {
          // noop
        }
      }
    }
  }

  _opsLib () {
    if (this._isForcedOff()) {
      return null
    }

    try {
      return this._opsNpm()
    } catch (_e) {}

    try {
      return this._opsCli()
    } catch (_e) {}

    return null
  }

  _isForcedOff () {
    return process.env.DOTENVX_OPS_OFF === 'true'
  }
}

module.exports = Ops
