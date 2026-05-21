const path = require('path')
const childProcess = require('child_process')
const util = require('util')
const { logger } = require('../../shared/logger')

const execFile = util.promisify(childProcess.execFile)

class Ops {
  async status () {
    if (this._isForcedOff()) return 'off'

    const binary = await this._resolveBinary()
    if (!binary) return 'off'

    try {
      return await this._exec(binary, ['status'])
    } catch (_e) {
      return 'off'
    }
  }

  statusSync () {
    if (this._isForcedOff()) return 'off'

    const binary = this._resolveBinarySync()
    if (!binary) return 'off'

    try {
      return this._execSync(binary, ['status'])
    } catch (_e) {
      return 'off'
    }
  }

  async keypair (publicKey, options = {}) {
    if (this._isForcedOff()) return {}

    const binary = await this._resolveBinary()
    if (!binary) return {}

    const args = ['keypair']
    if (options.noSpinner) args.push('--no-spinner')
    if (options.token) args.push('--token', options.token)
    if (publicKey) args.push(publicKey)

    try {
      return JSON.parse(await this._execInteractive(binary, args, {
        onStderr: options.onStderr
      }))
    } catch (_e) {
      return {}
    }
  }

  keypairSync (publicKey, options = {}) {
    if (this._isForcedOff()) return {}

    const binary = this._resolveBinarySync()
    if (!binary) return {}

    const args = ['keypair']
    if (options.noSpinner) args.push('--no-spinner')
    if (options.token) args.push('--token', options.token)
    if (publicKey) args.push(publicKey)

    try {
      return JSON.parse(this._execInteractiveSync(binary, args))
    } catch (_e) {
      return {}
    }
  }

  observe (payload) {
    if (this._isForcedOff()) return

    const binary = this._resolveBinarySync()
    if (!binary) return

    let status = 'off'
    try {
      status = this._execSync(binary, ['status'])
    } catch (_e) {
      return
    }
    if (status === 'off') return

    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
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

  async _exec (binary, args) {
    const { stdout, stderr } = await execFile(binary, args)
    if (stderr && stderr.length > 0) {
      process.stderr.write(stderr.toString())
    }
    return stdout.toString().trim()
  }

  _execSync (binary, args) {
    logger.debug(binary)
    logger.debug(args)
    return childProcess.execFileSync(binary, args).toString().trim()
  }

  _execInteractive (binary, args, options = {}) {
    return new Promise((resolve, reject) => {
      const spawnOptions = {
        stdio: ['inherit', 'pipe', 'pipe']
      }
      const subprocess = childProcess.spawn(binary, args, spawnOptions)
      let stdout = ''
      let sawStderr = false

      subprocess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      subprocess.stderr.on('data', (data) => {
        if (!sawStderr) {
          sawStderr = true
          if (options.onStderr) options.onStderr()
        }

        process.stderr.write(data)
      })
      subprocess.on('error', reject)
      subprocess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`${binary} ${args.join(' ')} exited with code ${code}`))
          return
        }

        resolve(stdout.trim())
      })
    })
  }

  _execInteractiveSync (binary, args) {
    logger.debug(binary)
    logger.debug(args)
    return childProcess.execFileSync(binary, args, {
      stdio: ['inherit', 'pipe', 'inherit']
    }).toString().trim()
  }

  async _resolveBinary () {
    if (this._binaryPromise) return this._binaryPromise

    this._binaryPromise = (async () => {
      const npmBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
      try {
        await this._exec(npmBin, ['--version'])
        return npmBin
      } catch (_e) {}

      try {
        await this._exec('dotenvx-ops', ['--version'])
        return 'dotenvx-ops'
      } catch (_e) {}

      return null
    })()

    return this._binaryPromise
  }

  _resolveBinarySync () {
    if (this._binarySync !== undefined) return this._binarySync

    const npmBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
    try {
      this._execSync(npmBin, ['--version'])
      this._binarySync = npmBin
      return this._binarySync
    } catch (err) {
      logger.debug(err.message)
    }

    try {
      this._execSync('dotenvx-ops', ['--version'])
      this._binarySync = 'dotenvx-ops'
      return this._binarySync
    } catch (err) {
      logger.debug(err.message)
    }

    this._binarySync = null
    return null
  }

  _isForcedOff () {
    return process.env.DOTENVX_NO_OPS === 'true'
  }
}

module.exports = Ops
