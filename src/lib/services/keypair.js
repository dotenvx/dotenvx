const keypairResolver = require('./../resolvers/keypair')

class Keypair {
  constructor (options = {}) {
    this.envFile = options.envFile || '.env'
    this.envKeysFilepath = options.envKeysFilepath
    this.processEnv = options.processEnv || process.env
    this.noArmor = options.noArmor || false
    this.command = options.command
    this.onStatus = options.onStatus
  }

  runSync () {
    return keypairResolver.sync(this._options())
  }

  async run () {
    return keypairResolver(this._options())
  }

  _options () {
    return {
      envFile: this.envFile,
      envKeysFilepath: this.envKeysFilepath,
      processEnv: this.processEnv,
      noArmor: this.noArmor,
      onStatus: this.onStatus
    }
  }
}

module.exports = Keypair
