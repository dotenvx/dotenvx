const envsResolver = require('./../resolvers/envs')

class Run {
  constructor (envs = [], overload = false, processEnv = process.env, envKeysFilepath = null, noArmor = false, options = {}) {
    this.envs = envs
    this.overload = overload
    this.processEnv = processEnv
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.noSpinner = options.noSpinner
    this.token = options.token
    this.command = options.command
    this.onStatus = options.onStatus

    this.processedEnvs = []
    this.readableFilepaths = new Set()
  }

  runSync () {
    return envsResolver.sync({
      envs: this.envs,
      overload: this.overload,
      processEnv: this.processEnv,
      envKeysFilepath: this.envKeysFilepath,
      noArmor: this.noArmor,
      noSpinner: this.noSpinner,
      token: this.token,
      command: this.command,
      onStatus: this.onStatus
    })
  }

  async run () {
    return envsResolver({
      envs: this.envs,
      overload: this.overload,
      processEnv: this.processEnv,
      envKeysFilepath: this.envKeysFilepath,
      noArmor: this.noArmor,
      noSpinner: this.noSpinner,
      token: this.token,
      command: this.command,
      onStatus: this.onStatus
    })
  }
}

module.exports = Run
