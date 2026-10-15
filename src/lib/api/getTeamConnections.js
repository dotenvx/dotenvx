const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class GetTeamConnections {
  constructor (hostname, token, team, service) {
    Object.assign(this, { hostname, token, team, service })
  }

  async run () {
    const connections = []
    let page = 1
    while (page) {
      const query = new URLSearchParams({ service: this.service, page })
      const response = await http(`${this.hostname}/api/teams/${encodeURIComponent(this.team)}/connections?${query}`, {
        method: 'GET', headers: { Authorization: `Bearer ${normalizeToken(this.token)}` }
      })
      const json = await response.body.json()
      if (response.statusCode >= 400) throw buildApiError(response.statusCode, json)
      connections.push(...json.connections)
      page = json.meta && json.meta.next_page
    }
    return { connections }
  }
}

module.exports = GetTeamConnections
