const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class GetTeams {
  constructor (hostname, token) {
    this.hostname = hostname
    this.token = token
  }

  async run () {
    const teams = []
    let page = 1
    while (page) {
      const resp = await http(`${this.hostname}/api/teams?page=${page}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${normalizeToken(this.token)}` }
      })
      const json = await resp.body.json()
      if (resp.statusCode >= 400) throw buildApiError(resp.statusCode, json)
      teams.push(...json.teams)
      page = json.meta && json.meta.next_page
    }
    return { teams }
  }
}

module.exports = GetTeams
