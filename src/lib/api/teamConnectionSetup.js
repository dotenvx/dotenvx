const { http } = require('../helpers/http')
const buildApiError = require('../helpers/buildApiError')
const normalizeToken = require('../helpers/normalizeToken')

class TeamConnectionSetup {
  constructor (hostname, token, team) {
    this.url = `${hostname}/api/teams/${encodeURIComponent(team)}/connections/setup`
    this.token = token
  }

  async request (suffix, options) {
    const response = await http(`${this.url}${suffix}`, {
      ...options,
      headers: { Authorization: `Bearer ${normalizeToken(this.token)}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000)
    })
    const json = await response.body.json()
    if (response.statusCode >= 400) throw buildApiError(response.statusCode, json)
    return json
  }

  create (service) {
    return this.request('', { method: 'POST', body: JSON.stringify({ service }) })
  }

  status (id) {
    return this.request(`/${encodeURIComponent(id)}`, { method: 'GET' })
  }
}

module.exports = TeamConnectionSetup
