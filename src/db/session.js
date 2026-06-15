const Armor = require('./../lib/extensions/armor')
const Conf = require('conf')
const dotenv = require('dotenv')
const si = require('systeminformation')

const Device = require('./device')
const jsonToEnv = require('./../lib/helpers/jsonToEnv')
const { logger } = require('./../shared/logger')

const ARMOR = {
  HOSTNAME: 'DOTENVX_ARMOR_HOSTNAME',
  USER: 'DOTENVX_ARMOR_USER',
  USERNAME: 'DOTENVX_ARMOR_USERNAME',
  TOKEN: 'DOTENVX_ARMOR_TOKEN',
  ON: 'DOTENVX_ARMOR_ON',
  VERSION: 'DOTENVX_ARMOR_VERSION',
  VERSION_LAST_CHECK: 'DOTENVX_ARMOR_VERSION_LAST_CHECK'
}

class Session {
  constructor () {
    this.armor = new Armor()
    this.store = new Conf({
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

  //
  // armor status helpers
  //
  async noArmor () {
    const status = await this.armor.status()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  noArmorSync () {
    const status = this.armor.statusSync()
    logger.debug(`armor: ${status}`)
    return status === 'off'
  }

  status () {
    // if logged in
    if (this.username() && this.token() && this.on()) {
      return 'on'
    }

    return 'off'
  }

  //
  // Get
  //
  getSetting (key) {
    return this.store.get(ARMOR[key])
  }

  hostname () {
    return this.getSetting('HOSTNAME') || 'https://armor.dotenvx.com'
  }

  username () {
    return this.getSetting('USERNAME') || undefined
  }

  token () {
    return this.getSetting('TOKEN') || undefined
  }

  devicePublicKey () {
    return new Device().publicKey()
  }

  path () {
    return this.store.path
  }

  on () {
    return (this.getSetting('ON') || 'true') === 'true'
  }

  off () {
    return (this.getSetting('ON') || 'true') === 'false'
  }

  async systemInformation () {
    const system = await si.system()
    const osInfo = await si.osInfo()

    return {
      system_uuid: system.uuid,
      os_platform: osInfo.platform,
      os_arch: osInfo.arch
    }
  }

  async notifyUpdate () {
    // native login keeps this lightweight; sidecar commands still handle full update messaging
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

    this.store.set(ARMOR.USER, id)
    this.store.set(ARMOR.USERNAME, username)
    this.store.set(ARMOR.TOKEN, accessToken)
    this.store.set(ARMOR.HOSTNAME, hostname)
    this.store.set(ARMOR.ON, 'true')

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

    this.store.delete(ARMOR.USER)
    this.store.delete(ARMOR.USERNAME)
    this.store.delete(ARMOR.TOKEN)
    this.store.delete(ARMOR.HOSTNAME)
    this.store.delete(ARMOR.ON)
    this.store.delete(ARMOR.VERSION)
    this.store.delete(ARMOR.VERSION_LAST_CHECK)
    return true
  }

  //
  // on
  //
  turnOn () {
    this.store.set(ARMOR.ON, 'true')
    return 'true'
  }

  //
  // off
  //
  turnOff () {
    this.store.set(ARMOR.ON, 'false')
    return 'false'
  }
}

module.exports = Session
