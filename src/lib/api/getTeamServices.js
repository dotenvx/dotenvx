const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class GetTeamServices {
  constructor (hostname, token, team) {
    this.hostname = hostname
    this.token = token
    this.team = team
  }

  async run () {
    const resp = await http(`${this.hostname}/api/teams/${encodeURIComponent(this.team)}/services`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${normalizeToken(this.token)}` }
    })
    const json = await resp.body.json()
    if (resp.statusCode >= 400) throw buildApiError(resp.statusCode, json)
    return json
  }
}

module.exports = GetTeamServices
