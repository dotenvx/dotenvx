const store = require('./../../shared/store')

class Settings {
  run () {
    // returns json format of dotenvx.settings
    return this._store()
  }

  _store () {
    const h = {
      DOTENVX_SETTINGS_PATH: store.configPath()
    }

    return { ...h, ...store.confStore.store }
  }
}

module.exports = Settings
