const store = require('./../../shared/store')

class Settings {
  constructor (key = null) {
    this.key = key
  }

  run () {
    const store = this._store()

    if (this.key) {
      return store[this.key]
    }

    // json of dotenvx.settings
    return store
  }

  _store () {
    const h = {
      DOTENVX_SETTINGS_FILEPATH: store.configPath()
    }

    return { ...h, ...store.confStore.store }
  }
}

module.exports = Settings
