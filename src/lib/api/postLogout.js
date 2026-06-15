const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class PostLogout {
  constructor (hostname, token) {
    this.hostname = hostname
    this.token = token
  }

  async run () {
    const token = normalizeToken(this.token)
    const url = `${this.hostname}/api/logout`

    const resp = await http(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    const json = await resp.body.json()

    if (resp.statusCode >= 400) {
      throw buildApiError(resp.statusCode, json)
    }

    return json
  }
}

module.exports = PostLogout
