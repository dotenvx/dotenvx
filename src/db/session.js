const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const dotenv = require('dotenv')
const envPaths = require('env-paths')

const jsonToEnv = require('./../lib/helpers/jsonToEnv')
const packageJson = require('./../lib/helpers/packageJson')
const { http } = require('./../lib/helpers/http')
const { logger } = require('./../shared/logger')

const HOURS_24 = 60 * 60 * 24 * 1000
const VERSION_URL = 'https://dotenvx.sh/VERSION'

const ARMOR = {
  HOSTNAME: 'DOTENVX_ARMOR_HOSTNAME',
  USER: 'DOTENVX_ARMOR_USER',
  USERNAME: 'DOTENVX_ARMOR_USERNAME',
  TOKEN: 'DOTENVX_ARMOR_TOKEN'
}

const DOTENVX = {
  VERSION: 'DOTENVX_VERSION',
  VERSION_LAST_CHECK: 'DOTENVX_VERSION_LAST_CHECK'
}

function normalizeVersion (version) {
  return String(version || '').trim().replace(/^v/, '')
}

function parseVersion (version) {
  return normalizeVersion(version).split('.').map(part => Number.parseInt(part, 10) || 0)
}

function versionGreaterThan (left, right) {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)

  for (let i = 0; i < Math.max(leftParts.length, rightParts.length); i++) {
    const leftPart = leftParts[i] || 0
    const rightPart = rightParts[i] || 0

    if (leftPart > rightPart) return true
    if (leftPart < rightPart) return false
  }

  return false
}

class Session {
  constructor () {
    this._store = null
  }

  _configPath () {
    const cwd = process.env.DOTENVX_CONFIG || this._defaultConfigCwd()
    return path.resolve(cwd, '.env')
  }

  _defaultConfigCwd () {
    return envPaths('dotenvx', { suffix: '' }).config
  }

  _configExists () {
    return fs.existsSync(this._configPath())
  }

  _newStore () {
    return new Conf({
      cwd: process.env.DOTENVX_CONFIG || undefined,
      projectName: 'dotenvx',
      configName: '.env',
      projectSuffix: '',
      fileExtension: '',
      serialize: function (json) {
        return jsonToEnv(json)
      },
      // Convert .env format to an object
      deserialize: function (env) {
        return dotenv.parse(env)
      }
    })
  }

  createStore () {
    if (!this._store) this._store = this._newStore()
    return this._store
  }

  openStore () {
    if (!this._store && !this._configExists()) {
      return null
    }

    if (!this._store) this._store = this._newStore()
    return this._store
  }

  get store () {
    return this.openStore()
  }

  status () {
    // if logged in
    if (this.username() && this.token()) {
      return 'on'
    }

    return 'off'
  }

  //
  // Get
  //
  readSetting (key) {
    const store = this.openStore()
    if (!store) return undefined

    return store.get(ARMOR[key])
  }

  readDotenvxSetting (key) {
    const store = this.openStore()
    if (!store) return undefined

    return store.get(DOTENVX[key])
  }

  hostname () {
    return this.readSetting('HOSTNAME') || 'https://armor.dotenvx.com'
  }

  username () {
    return this.readSetting('USERNAME') || undefined
  }

  token () {
    return this.readSetting('TOKEN') || undefined
  }

  devicePublicKey () {
    const Device = require('./device')
    return new Device().publicKey()
  }

  path () {
    return this._store ? this._store.path : this._configPath()
  }

  async systemInformation () {
    const si = require('systeminformation')
    const system = await si.system()
    const osInfo = await si.osInfo()

    return {
      system_uuid: system.uuid,
      os_platform: osInfo.platform,
      os_arch: osInfo.arch
    }
  }

  //
  // Notify Update
  //
  async notifyUpdate () {
    try {
      const store = this.openStore()
      if (!store) return

      logger.debug('checking if update available')

      const lastCheck = Number(this.readDotenvxSetting('VERSION_LAST_CHECK') || 0)
      const now = Date.now()

      if ((lastCheck + HOURS_24) >= now) return

      let remote = packageJson.version

      try {
        logger.debug('fetching latest available dotenvx version')
        const response = await http(VERSION_URL)
        remote = normalizeVersion(await response.body.text())
        logger.debug(`latest dotenvx version: ${remote}`)
        store.set(DOTENVX.VERSION, remote)
      } catch (error) {
        logger.debug(error.message)
      }

      store.set(DOTENVX.VERSION_LAST_CHECK, now)

      if (versionGreaterThan(remote, packageJson.version)) {
        console.error('⛆ update available [npm install @dotenvx/dotenvx@latest]')
      }
    } catch (error) {
      logger.debug(error.message)
    }
  }

  //
  // armor status helpers
  //
  async noArmor () {
    if (process.env.DOTENVX_NO_ARMOR === 'true') {
      logger.debug('armor: off')
      return true
    }

    const status = this.status()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  noArmorSync () {
    if (process.env.DOTENVX_NO_ARMOR === 'true') {
      logger.debug('armor: off')
      return true
    }

    const status = this.status()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  //
  // Set/Delete
  //
  login (hostname, id, username, accessToken) {
    if (!hostname) {
      throw new Error('DOTENVX_ARMOR_HOSTNAME not set. Run [dotenvx login]')
    }

    if (!id) {
      throw new Error('DOTENVX_ARMOR_USER not set. Run [dotenvx login]')
    }

    if (!username) {
      throw new Error('DOTENVX_ARMOR_USERNAME not set. Run [dotenvx login]')
    }

    if (!accessToken) {
      throw new Error('DOTENVX_ARMOR_TOKEN not set. Run [dotenvx login]')
    }

    const store = this.createStore()
    store.set(ARMOR.USER, id)
    store.set(ARMOR.USERNAME, username)
    store.set(ARMOR.TOKEN, accessToken)
    store.set(ARMOR.HOSTNAME, hostname)

    return accessToken
  }

  logout (hostname, id, accessToken) {
    if (!hostname) {
      throw new Error('DOTENVX_ARMOR_HOSTNAME not set. Run [dotenvx login]')
    }

    if (!id) {
      throw new Error('DOTENVX_ARMOR_USER not set. Run [dotenvx login]')
    }

    if (!accessToken) {
      throw new Error('DOTENVX_ARMOR_TOKEN not set. Run [dotenvx login]')
    }

    const store = this.openStore()
    if (!store) return true

    store.delete(ARMOR.USER)
    store.delete(ARMOR.USERNAME)
    store.delete(ARMOR.TOKEN)
    store.delete(ARMOR.HOSTNAME)
    store.delete(DOTENVX.VERSION)
    store.delete(DOTENVX.VERSION_LAST_CHECK)
    return true
  }
}

module.exports = Session
