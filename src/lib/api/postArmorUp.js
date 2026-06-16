const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const packageJson = require('../helpers/packageJson')
const normalizeToken = require('../helpers/normalizeToken')

class PostArmorUp {
  constructor (hostname, token, devicePublicKey, publicKey, privateKey, team) {
    this.hostname = hostname
    this.token = token
    this.devicePublicKey = devicePublicKey
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.team = team
  }

  async run () {
    const token = normalizeToken(this.token)
    const devicePublicKey = this.devicePublicKey
    const publicKey = this.publicKey
    const privateKey = this.privateKey
    const team = this.team
    const url = `${this.hostname}/api/armor/up`

    const body = {
      device_public_key: devicePublicKey,
      cli_version: packageJson.version,
      public_key: publicKey,
      private_key: privateKey,
      team
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

module.exports = PostArmorUp
