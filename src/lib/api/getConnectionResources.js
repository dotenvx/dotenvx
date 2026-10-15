const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class GetConnectionResources {
  constructor (hostname, token, team, connectionId) {
    this.url = `${hostname}/api/teams/${encodeURIComponent(team)}/connections/${encodeURIComponent(connectionId)}/resources`
    this.token = token
  }

  async run (query = '') {
    const response = await http(`${this.url}?${new URLSearchParams({ q: query })}`, {
      method: 'GET', headers: { Authorization: `Bearer ${normalizeToken(this.token)}` }
    })
    const json = await response.body.json()
    if (response.statusCode >= 400) throw buildApiError(response.statusCode, json)
    return json
  }
}

module.exports = GetConnectionResources
