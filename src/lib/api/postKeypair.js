const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const packageJson = require('../helpers/packageJson')
const normalizeToken = require('../helpers/normalizeToken')

class PostKeypair {
  constructor (hostname, token, devicePublicKey, publicKey, team, metadata, grantToken) {
    this.hostname = hostname || 'https://armor.dotenvx.com'
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.publicKey = publicKey
    this.team = team
    this.metadata = metadata
    this.grantToken = grantToken
  }

  async run () {
    const token = normalizeToken(this.token)
    const url = `${this.hostname}/api/keypair`
    const body = {
      device_public_key: this.devicePublicKey,
      cli_version: packageJson.version
    }

    if (this.publicKey) {
      body.public_key = this.publicKey
    }

    if (this.team) {
      body.team = this.team
    }

    if (this.metadata && Object.keys(this.metadata).length > 0) {
      body.metadata = this.metadata
    }

    if (this.grantToken) {
      body.grant_token = this.grantToken
    }

    const resp = await http(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const json = await resp.body.json()

    if (resp.statusCode >= 400) {
      throw buildApiError(resp.statusCode, json)
    }

    return json
  }
}

module.exports = PostKeypair
