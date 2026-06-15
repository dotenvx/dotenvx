const { http } = require('../helpers/http')
const buildOauthError = require('../helpers/buildOauthError')

const OAUTH_CLIENT_ID = 'oac_dotenvxcli'

class PostOauthToken {
  constructor (hostname, deviceCode) {
    this.hostname = hostname
    this.deviceCode = deviceCode
  }

  async run () {
    const resp = await http(`${this.hostname}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: OAUTH_CLIENT_ID,
        device_code: this.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })

    const json = await resp.body.json()

    if (resp.statusCode >= 400) {
      throw buildOauthError(resp.statusCode, json)
    }

    return json
  }
}

module.exports = PostOauthToken
