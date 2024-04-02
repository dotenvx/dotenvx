const { request } = require('undici')

const packageJson = require('./packageJson')

class RemoteVersion {
  constructor () {
    this.packageName = '@dotenvx/dotenvx'
    this.tag = 'latest'
  }

  /**
  * Returns the latest version of this package
  * @returns {Promise<string?>}
  */
  async run () {
    return await this._npmVersion()
  }

  async _npmVersion () {
    try {
      const response = await request(`https://registry.npmjs.org/${this.packageName}/${this.tag}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
          'Content-Type': 'application/json'
        }
      })

      if (response.statusCode !== 200) {
        return packageJson.version
      }

      const data = await response.body.json()

      return data.version
    } catch (_error) {
      return packageJson.version
    }
  }
}

module.exports = RemoteVersion
