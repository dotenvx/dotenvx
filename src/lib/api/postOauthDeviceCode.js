const { http } = require('../helpers/http')
const buildOauthError = require('../helpers/buildOauthError')

const OAUTH_CLIENT_ID = 'oac_dotenvxcli'

class PostOauthDeviceCode {
  constructor (hostname, devicePublicKey, systemInformation, dotenvxProjectId = null) {
    this.hostname = hostname
    this.devicePublicKey = devicePublicKey
    this.systemInformation = systemInformation
    this.dotenvxProjectId = dotenvxProjectId
  }

  async run () {
    const resp = await http(`${this.hostname}/oauth/device/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: OAUTH_CLIENT_ID,
        device_public_key: this.devicePublicKey,
        system_information: this.systemInformation,
        dotenvx_project_id: this.dotenvxProjectId
      })
    })

    const json = await resp.body.json()

    if (resp.statusCode >= 400) {
      throw buildOauthError(resp.statusCode, json)
    }

    return json
  }
}

module.exports = PostOauthDeviceCode
