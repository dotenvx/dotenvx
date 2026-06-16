const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const dotenv = require('dotenv')
const envPaths = require('env-paths')

const jsonToEnv = require('./../lib/helpers/jsonToEnv')
const { logger } = require('./../shared/logger')

const ARMOR = {
  HOSTNAME: 'DOTENVX_ARMOR_HOSTNAME',
  USER: 'DOTENVX_ARMOR_USER',
  USERNAME: 'DOTENVX_ARMOR_USERNAME',
  TOKEN: 'DOTENVX_ARMOR_TOKEN'
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
    return true
  }
}

module.exports = Session
